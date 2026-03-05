'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type RoutineType = 'fullbody' | 'upperlower' | 'ppl' | 'arnold' | null

const routineOptions = [
  {
    id: 'fullbody' as const,
    name: 'Full Body',
    description: 'Train your entire body in each session. Great for beginners or 3 days per week.',
    days: 3,
  },
  {
    id: 'upperlower' as const,
    name: 'Upper/Lower Split',
    description: 'Alternate between upper body and lower body days. Ideal for 4 days per week.',
    days: 4,
  },
  {
    id: 'ppl' as const,
    name: 'Push/Pull/Legs (PPL)',
    description: 'Push exercises, pull exercises, and legs. Perfect for 5-6 days per week.',
    days: 6,
  },
  {
    id: 'arnold' as const,
    name: 'Arnold Split',
    description: 'Chest & Back, Shoulders & Arms, Legs. Classic 6-day split popularized by Arnold Schwarzenegger.',
    days: 6,
  },
]

export default function PlansPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineType>(null)
  const [showRoutineSelection, setShowRoutineSelection] = useState(false)
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchPlans()
    }
  }, [status, router])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoutineSelect = (routineType: RoutineType) => {
    setSelectedRoutine(routineType)
  }

  const handleActivatePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/plans/${planId}/activate`, {
        method: 'POST',
      })
      if (response.ok) {
        await fetchPlans()
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error activating plan:', error)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return
    }

    setDeletingPlanId(planId)
    try {
      const response = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchPlans()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete plan')
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('An error occurred')
    } finally {
      setDeletingPlanId(null)
    }
  }

  const handleGenerate = async () => {
    if (!selectedRoutine) {
      setShowRoutineSelection(true)
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineType: selectedRoutine }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchPlans() // Refresh plans list
        setShowRoutineSelection(false)
        setSelectedRoutine(null)
        // Optionally activate the new plan
        if (data.plan) {
          await handleActivatePlan(data.plan.id)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate plan')
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      alert('An error occurred')
    } finally {
      setGenerating(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
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
            <CardTitle>Workout Plans</CardTitle>
            <CardDescription>
              Generate a personalized workout plan based on your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showRoutineSelection ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Your Workout Plans</h3>
                    <p className="text-sm text-muted-foreground">
                      You can have up to 4 plans. {plans.length}/4 created.
                    </p>
                  </div>
                  {plans.length < 4 && (
                    <Button onClick={() => setShowRoutineSelection(true)}>
                      Create New Plan
                    </Button>
                  )}
                </div>

                {plans.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      You don't have any workout plans yet. Create one to get started!
                    </p>
                    <Button onClick={() => setShowRoutineSelection(true)} size="lg">
                      Create Your First Plan
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {plans.map((plan) => (
                      <Card key={plan.id} className={plan.active ? 'border-primary border-2' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{plan.name}</h4>
                                {plan.active && (
                                  <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                Goal: {plan.goal.replace('_', ' ')} • Created {new Date(plan.createdAt).toLocaleDateString()}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {plan.days.map((day: any) => (
                                  <span key={day.id} className="px-2 py-1 text-xs bg-secondary rounded">
                                    {day.title} ({day.exercises.length} exercises)
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {!plan.active && (
                                <Button
                                  size="sm"
                                  onClick={() => handleActivatePlan(plan.id)}
                                  variant="outline"
                                >
                                  Set Active
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleDeletePlan(plan.id)}
                                disabled={deletingPlanId === plan.id}
                                variant="destructive"
                              >
                                {deletingPlanId === plan.id ? 'Deleting...' : 'Delete'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Link href="/dashboard">
                    <Button variant="outline">Back to Dashboard</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Your Workout Routine</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {routineOptions.map((routine) => (
                      <button
                        key={routine.id}
                        type="button"
                        onClick={() => handleRoutineSelect(routine.id)}
                        className={`p-5 border-2 rounded-lg text-left transition-all ${
                          selectedRoutine === routine.id
                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                            : 'hover:bg-accent hover:border-accent-foreground/20 border-border'
                        }`}
                      >
                        <div className="font-semibold text-base mb-2">{routine.name}</div>
                        <div className={`text-sm mb-2 ${
                          selectedRoutine === routine.id
                            ? 'text-primary-foreground/90'
                            : 'text-muted-foreground'
                        }`}>
                          {routine.description}
                        </div>
                        <div className={`text-xs ${
                          selectedRoutine === routine.id
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        }`}>
                          {routine.days} days per week
                        </div>
                      </button>
                    ))}
                  </div>
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => router.push(`/plans/build?routine=${selectedRoutine}`)}
                          disabled={!selectedRoutine} 
                          size="lg"
                        >
                          Customize Exercises
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowRoutineSelection(false)
                            setSelectedRoutine(null)
                          }} 
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

