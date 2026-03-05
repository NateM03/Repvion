'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchRewards()
    }
  }, [status, router])

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/rewards')
      if (response.ok) {
        const data = await response.json()
        setRewards(data.rewards)
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEquip = async (rewardId: string) => {
    try {
      const response = await fetch(`/api/rewards/${rewardId}/equip`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchRewards()
      }
    } catch (error) {
      console.error('Error equipping reward:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  const unlockedRewards = rewards.filter(r => r.unlocked)
  const avatars = rewards.filter(r => r.type === 'avatar')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold">Repvion</h1>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Rewards & Avatars</CardTitle>
            <CardDescription>
              View your unlocked rewards and equip avatars
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Unlocked Rewards ({unlockedRewards.length})</h3>
                <div className="grid gap-4">
                  {unlockedRewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{reward.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {reward.type} • Unlocked {new Date(reward.unlockedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reward.equipped && (
                          <Badge variant="default">Equipped</Badge>
                        )}
                        {reward.type === 'avatar' && !reward.equipped && (
                          <Button
                            size="sm"
                            onClick={() => handleEquip(reward.id)}
                          >
                            Equip
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">All Rewards</h3>
                <div className="grid gap-4">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        !reward.unlocked ? 'opacity-50' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium">{reward.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {reward.type}
                          {reward.requiredLevel && ` • Level ${reward.requiredLevel}`}
                          {reward.requiredStreak && ` • ${reward.requiredStreak} day streak`}
                        </div>
                      </div>
                      {!reward.unlocked && (
                        <Badge variant="outline">Locked</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

