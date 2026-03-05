'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type RoutineType = 'fullbody' | 'upperlower' | 'ppl' | 'arnold'

const muscleGroupMap: Record<RoutineType, Record<number, string[]>> = {
  ppl: {
    0: ['chest', 'shoulders', 'triceps'], // Push
    1: ['back', 'biceps'], // Pull
    2: ['legs', 'quadriceps', 'hamstrings', 'calves', 'glutes'], // Legs
  },
  arnold: {
    0: ['chest', 'back'], // Chest & Back
    1: ['shoulders', 'biceps', 'triceps'], // Shoulders & Arms
    2: ['legs', 'quadriceps', 'hamstrings', 'calves', 'glutes'], // Legs
  },
  upperlower: {
    0: ['chest', 'shoulders', 'triceps', 'back', 'biceps'], // Upper
    1: ['legs', 'quadriceps', 'hamstrings', 'calves', 'glutes'], // Lower
  },
  fullbody: {
    0: ['chest', 'back', 'shoulders', 'legs', 'biceps', 'triceps'], // Full Body
  },
}

const dayTitles: Record<RoutineType, Record<number, string>> = {
  ppl: {
    0: 'Push (Chest, Shoulders, Triceps)',
    1: 'Pull (Back, Biceps)',
    2: 'Legs (Quads, Hamstrings, Calves)',
  },
  arnold: {
    0: 'Chest & Back',
    1: 'Shoulders & Arms',
    2: 'Legs',
  },
  upperlower: {
    0: 'Upper Body',
    1: 'Lower Body',
  },
  fullbody: {
    0: 'Full Body',
  },
}

export default function BuildWorkoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const routineType = searchParams.get('routine') as RoutineType | null

  const [exercises, setExercises] = useState<Record<string, any[]>>({})
  const [selectedExercises, setSelectedExercises] = useState<Record<number, Record<string, string[]>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const [searchResults, setSearchResults] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (!routineType || !['ppl', 'arnold', 'upperlower', 'fullbody'].includes(routineType)) {
      router.push('/plans')
      return
    }

    fetchExercises()
  }, [status, routineType, router])

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        // Group exercises by muscle group
        const grouped: Record<string, any[]> = {}
        data.exercises.forEach((ex: any) => {
          const mg = ex.muscleGroup.toLowerCase()
          if (!grouped[mg]) grouped[mg] = []
          grouped[mg].push(ex)
        })
        setExercises(grouped)
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (muscleGroup: string, query: string) => {
    setSearchQueries(prev => ({ ...prev, [muscleGroup]: query }))
    
    if (query.length < 2) {
      setSearchResults(prev => {
        const updated = { ...prev }
        delete updated[muscleGroup]
        return updated
      })
      return
    }

    try {
      const response = await fetch(`/api/exercises?muscleGroup=${muscleGroup}&search=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(prev => ({
          ...prev,
          [muscleGroup]: data.exercises,
        }))
      }
    } catch (error) {
      console.error('Error searching exercises:', error)
    }
  }

  const toggleExercise = (dayIndex: number, muscleGroup: string, exerciseId: string) => {
    setSelectedExercises(prev => {
      const dayExercises = prev[dayIndex] || {}
      const muscleExercises = dayExercises[muscleGroup] || []
      
      const isSelected = muscleExercises.includes(exerciseId)
      
      return {
        ...prev,
        [dayIndex]: {
          ...dayExercises,
          [muscleGroup]: isSelected
            ? muscleExercises.filter(id => id !== exerciseId)
            : [...muscleExercises, exerciseId],
        },
      }
    })
  }

  const handleSave = async () => {
    if (!routineType) return

    setSaving(true)
    try {
      const planData: any = {
        routineType,
        days: [],
      }

      const days = muscleGroupMap[routineType]
      Object.keys(days).forEach((dayKey) => {
        const dayIndex = parseInt(dayKey)
        const muscleGroups = days[dayIndex]
        const dayExercises: any[] = []
        let order = 1

        muscleGroups.forEach(muscleGroup => {
          const selected = selectedExercises[dayIndex]?.[muscleGroup] || []
          selected.forEach(exerciseId => {
            dayExercises.push({
              exerciseId,
              order: order++,
              sets: 0, // User will set this when starting workout
              reps: '', // User will set this when starting workout
              restSeconds: null, // User will set this when starting workout
            })
          })
        })

        if (dayExercises.length > 0) {
          planData.days.push({
            dayIndex,
            title: dayTitles[routineType][dayIndex],
            exercises: dayExercises,
          })
        }
      })

      // Duplicate days for 6-day routines
      if (routineType === 'ppl' || routineType === 'arnold') {
        const firstCycle = [...planData.days]
        planData.days = [...firstCycle, ...firstCycle]
        // Update dayIndex for second cycle
        planData.days.forEach((day: any, idx: number) => {
          day.dayIndex = idx
        })
      }

      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      })

      if (response.ok) {
        const data = await response.json()
        // Activate the new plan
        await fetch(`/api/plans/${data.plan.id}/activate`, { method: 'POST' })
        router.push('/dashboard')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading || !routineType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  const days = muscleGroupMap[routineType]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/plans">
            <h1 className="text-2xl font-bold">Repvion</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Build Your {routineType === 'ppl' ? 'Push/Pull/Legs' : routineType === 'arnold' ? 'Arnold' : routineType === 'upperlower' ? 'Upper/Lower' : 'Full Body'} Workout</CardTitle>
            <CardDescription>
              Select exercises for each muscle group. You can add as many exercises as you want per muscle group.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {Object.keys(days).map((dayKey) => {
              const dayIndex = parseInt(dayKey)
              const muscleGroups = days[dayIndex]
              
              return (
                <div key={dayIndex} className="space-y-4 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold">{dayTitles[routineType][dayIndex]}</h3>
                  
                  {muscleGroups.map((muscleGroup) => {
                    const muscleExercises = exercises[muscleGroup] || []
                    const selected = selectedExercises[dayIndex]?.[muscleGroup] || []
                    const searchQuery = searchQueries[muscleGroup] || ''
                    const searchResultsForGroup = searchResults[muscleGroup] || []
                    const displayExercises = searchQuery.length >= 2 ? searchResultsForGroup : muscleExercises
                    
                    return (
                      <div key={muscleGroup} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium capitalize">{muscleGroup}</h4>
                          <span className="text-xs text-muted-foreground">
                            {selected.length} selected
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder={`Search ${muscleGroup} exercises (e.g., "incline", "dumbbell", "cable")...`}
                          value={searchQuery}
                          onChange={(e) => handleSearch(muscleGroup, e.target.value)}
                          className="w-full px-3 py-2 border rounded-md mb-2"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                          {displayExercises.map((exercise) => {
                            const isSelected = selected.includes(exercise.id)
                            return (
                              <button
                                key={exercise.id}
                                type="button"
                                onClick={() => toggleExercise(dayIndex, muscleGroup, exercise.id)}
                                className={`p-3 border rounded-lg text-left transition-all ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'hover:bg-accent border-border'
                                }`}
                              >
                                <div className="font-medium text-sm">{exercise.name}</div>
                                <div className={`text-xs mt-1 ${
                                  isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                }`}>
                                  {exercise.equipment}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        {displayExercises.length === 0 && searchQuery.length >= 2 && (
                          <p className="text-sm text-muted-foreground">
                            No exercises found for "{searchQuery}". Try a different search term.
                          </p>
                        )}
                        {displayExercises.length === 0 && searchQuery.length < 2 && (
                          <p className="text-sm text-muted-foreground">No exercises available for {muscleGroup}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            <div className="flex gap-4 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? 'Creating Plan...' : 'Create Workout Plan'}
              </Button>
              <Link href="/plans">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

