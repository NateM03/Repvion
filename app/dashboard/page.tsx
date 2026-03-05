'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkoutCard } from '@/components/WorkoutCard'
import { XPBar } from '@/components/XPBar'
import { StreakPill } from '@/components/StreakPill'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [workoutDay, setWorkoutDay] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchUserData()
      fetchTodayWorkout()
    }
  }, [status, router])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchTodayWorkout = async () => {
    try {
      const response = await fetch('/api/workouts/today')
      if (response.ok) {
        const data = await response.json()
        setWorkoutDay(data.workoutDay)
      }
    } catch (error) {
      console.error('Error fetching workout:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteWorkout = async () => {
    if (!workoutDay) return

    setCompleting(true)
    try {
      const response = await fetch(`/api/workouts/${workoutDay.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseLogs: [] }),
      })

      if (response.ok) {
        await fetchUserData()
        await fetchTodayWorkout()
      }
    } catch (error) {
      console.error('Error completing workout:', error)
    } finally {
      setCompleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const hasProfile = !!user.profile
  const hasPlan = workoutDay !== null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Repvion</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-muted-foreground">{user.username}</span>
            <Link href="/leaderboard">
              <Button variant="ghost">Leaderboard</Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!hasProfile ? (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Set up your profile to get personalized workout plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/onboarding">
                <Button>Go to Onboarding</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Your Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.stats && (
                    <>
                      <XPBar totalXp={user.stats.totalXp} level={user.stats.level} />
                      <StreakPill
                        currentStreak={user.stats.currentStreak}
                        longestStreak={user.stats.longestStreak}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/plans">
                    <Button className="w-full">
                      {hasPlan ? 'Manage Plans' : 'Generate Workout Plan'}
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="outline" className="w-full">
                      View Leaderboard
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full">
                      Settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {user.stats?.workoutsThisWeek || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Workouts completed</p>
                </CardContent>
              </Card>
            </div>

            {hasPlan ? (
              <div className="max-w-2xl">
                <div className="space-y-4">
                  {workoutDay && (
                    <Link href={`/workouts/${workoutDay.id}`}>
                      <Button className="w-full mb-4" size="lg">
                        Start Workout - Log Sets & Weight
                      </Button>
                    </Link>
                  )}
                  <WorkoutCard
                    workoutDay={workoutDay}
                    onComplete={handleCompleteWorkout}
                    isLoading={completing}
                  />
                </div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Workout Plan</CardTitle>
                  <CardDescription>
                    Generate a personalized workout plan to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/plans">
                    <Button>Generate Plan</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}

