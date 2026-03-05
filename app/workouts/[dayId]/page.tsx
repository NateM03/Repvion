'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function WorkoutLogPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const dayId = params.dayId as string

  const [workoutDay, setWorkoutDay] = useState<any>(null)
  const [exercisePlans, setExercisePlans] = useState<Record<string, { sets: number; reps: string; restSeconds: number }>>({})
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, Array<{ weight?: number; reps: number }>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workoutStarted, setWorkoutStarted] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated' && dayId) {
      fetchWorkoutDay()
    }
  }, [status, dayId, router])

  const fetchWorkoutDay = async () => {
    try {
      const response = await fetch(`/api/workouts/day/${dayId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkoutDay(data.workoutDay)
        
        // Initialize exercise plans (sets/reps/rest) - use existing values or defaults
        const initialPlans: Record<string, { sets: number; reps: string; restSeconds: number }> = {}
        const initialLogs: Record<string, Array<{ weight?: number; reps: number }>> = {}
        data.workoutDay.exercises.forEach((ex: any) => {
          // If sets is 0 or reps is empty, user hasn't set it yet - use defaults
          initialPlans[ex.id] = {
            sets: ex.sets > 0 ? ex.sets : 3,
            reps: ex.reps || '8-12',
            restSeconds: ex.restSeconds || 90,
          }
          // Initialize with one empty set ready to log
          initialLogs[ex.id] = [{ reps: 0 }]
        })
        setExercisePlans(initialPlans)
        setExerciseLogs(initialLogs)
      }
    } catch (error) {
      console.error('Error fetching workout day:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePlan = (exerciseId: string, field: 'sets' | 'reps' | 'restSeconds', value: number | string) => {
    setExercisePlans(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
      },
    }))
  }

  const startWorkout = () => {
    setWorkoutStarted(true)
  }

  const updateSet = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setExerciseLogs(prev => {
      const exerciseSets = [...(prev[exerciseId] || [])]
      exerciseSets[setIndex] = {
        ...exerciseSets[setIndex],
        [field]: value,
      }
      return {
        ...prev,
        [exerciseId]: exerciseSets,
      }
    })
  }

  const addSet = (exerciseId: string) => {
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), { reps: 0 }],
    }))
    // Also update the plan
    setExercisePlans(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        sets: prev[exerciseId].sets + 1,
      },
    }))
  }

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].filter((_, idx) => idx !== setIndex),
    }))
    // Also update the plan
    setExercisePlans(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        sets: Math.max(1, prev[exerciseId].sets - 1),
      },
    }))
  }

  const handleSave = async () => {
    if (!workoutDay) return

    setSaving(true)
    try {
      // Convert exercise logs to API format
      const exerciseLogsArray: any[] = []
      Object.keys(exerciseLogs).forEach(exerciseId => {
        exerciseLogs[exerciseId].forEach((set, setIndex) => {
          if (set.reps > 0) {
            exerciseLogsArray.push({
              exerciseId,
              setNumber: setIndex + 1,
              weight: set.weight || null,
              reps: set.reps,
            })
          }
        })
      })

      const response = await fetch(`/api/workouts/${dayId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          exerciseLogs: exerciseLogsArray,
          exercisePlans: exercisePlans, // Send planned sets/reps/rest
        }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save workout')
      }
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!workoutDay) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Workout not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold">Repvion</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>{workoutDay.title}</CardTitle>
            <CardDescription>Log your sets, weight, and reps for each exercise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!workoutStarted ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-6">
                  Ready to start your workout? Click below to begin logging your sets, weight, and reps.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={startWorkout} size="lg">
                    Start Workout
                  </Button>
                  <Link href="/dashboard">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {workoutDay.exercises.map((exercise: any) => {
                  const sets = exerciseLogs[exercise.id] || []
                  const plan = exercisePlans[exercise.id] || { sets: 3, reps: '8-12', restSeconds: 90 }
                  
                  return (
                    <div key={exercise.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{exercise.exercise.name}</h3>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{exercise.exercise.muscleGroup}</Badge>
                            <Badge variant="outline">{exercise.exercise.equipment}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Planning section - can be set as you go */}
                      <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">Plan (set as you go):</div>
                        <div className="grid md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Sets</label>
                            <input
                              type="number"
                              value={plan.sets}
                              onChange={(e) => {
                                const newSets = parseInt(e.target.value) || 1
                                updatePlan(exercise.id, 'sets', newSets)
                                // Adjust exercise logs to match
                                const currentSets = exerciseLogs[exercise.id] || []
                                if (newSets > currentSets.length) {
                                  // Add more sets
                                  setExerciseLogs(prev => ({
                                    ...prev,
                                    [exercise.id]: [...currentSets, ...Array(newSets - currentSets.length).fill(null).map(() => ({ reps: 0 }))],
                                  }))
                                } else if (newSets < currentSets.length) {
                                  // Remove sets
                                  setExerciseLogs(prev => ({
                                    ...prev,
                                    [exercise.id]: currentSets.slice(0, newSets),
                                  }))
                                }
                              }}
                              min="1"
                              max="10"
                              className="w-full px-2 py-1.5 text-sm border rounded-md"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Target Reps</label>
                            <input
                              type="text"
                              value={plan.reps}
                              onChange={(e) => updatePlan(exercise.id, 'reps', e.target.value)}
                              placeholder="8-12"
                              className="w-full px-2 py-1.5 text-sm border rounded-md"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium">Rest (sec)</label>
                            <input
                              type="number"
                              value={plan.restSeconds}
                              onChange={(e) => updatePlan(exercise.id, 'restSeconds', parseInt(e.target.value) || 0)}
                              min="0"
                              max="300"
                              className="w-full px-2 py-1.5 text-sm border rounded-md"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Logging section */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Log Your Sets:</div>
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                          <div>Set</div>
                          <div>Weight (lbs)</div>
                          <div>Reps</div>
                          <div></div>
                          <div></div>
                        </div>
                        {sets.map((set, setIndex) => (
                          <div key={setIndex} className="grid grid-cols-5 gap-2 items-center">
                            <div className="font-medium">{setIndex + 1}</div>
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => updateSet(exercise.id, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                              placeholder="Weight"
                              className="px-2 py-1.5 text-sm border rounded-md"
                            />
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => updateSet(exercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                              placeholder="Reps"
                              className="px-2 py-1.5 text-sm border rounded-md"
                            />
                            <div></div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSet(exercise.id, setIndex)}
                              disabled={sets.length <= 1}
                              className="text-xs"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exercise.id)}
                          className="w-full text-sm"
                        >
                          + Add Set
                        </Button>
                      </div>
                    </div>
                  )
                })}

                <div className="flex gap-4 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} size="lg" className="flex-1">
                    {saving ? 'Saving...' : 'Complete Workout'}
                  </Button>
                  <Link href="/dashboard">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

