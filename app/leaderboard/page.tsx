'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Leaderboard } from '@/components/Leaderboard'

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [scope, setScope] = useState<'friends' | 'global'>('global')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchFollowing()
      fetchLeaderboard()
    }
  }, [status, router, scope])

  const fetchFollowing = async () => {
    try {
      const response = await fetch('/api/social/following')
      if (response.ok) {
        const data = await response.json()
        setFollowing(data.following.map((u: any) => u.id))
      }
    } catch (error) {
      console.error('Error fetching following:', error)
    }
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leaderboard?scope=${scope}`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      })

      if (response.ok) {
        setFollowing([...following, userId])
      }
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      const response = await fetch('/api/social/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      })

      if (response.ok) {
        setFollowing(following.filter(id => id !== userId))
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
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
          <Link href="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex gap-4 mb-6">
          <Button
            variant={scope === 'global' ? 'default' : 'outline'}
            onClick={() => setScope('global')}
          >
            Global
          </Button>
          <Button
            variant={scope === 'friends' ? 'default' : 'outline'}
            onClick={() => setScope('friends')}
          >
            Friends
          </Button>
        </div>

        <Leaderboard
          entries={leaderboard}
          currentUserId={session?.user?.id}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          following={following}
        />
      </main>
    </div>
  )
}

