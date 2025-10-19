'use client'

import { useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { PresenceUser } from '@/lib/types'
import { getPresenceChannel, subscribeToPresenceChannel, isPresenceChannelSubscribed, markPresenceChannelSubscribed } from '@/lib/realtimeManager'

interface UsePresenceProps {
  user: User | null
}

export function usePresence({ user }: UsePresenceProps) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([])
  const isSubscribedRef = useRef(false)

  const userId = user?.id || ''
  const userName = user?.user_metadata?.full_name || user?.email || 'Anonymous'
  const avatarUrl = user?.user_metadata?.avatar_url

  useEffect(() => {
    // Don't set up presence if no user
    if (!user || !userId) return

    if (isSubscribedRef.current) return

    let interval: NodeJS.Timeout | null = null

    const setupPresence = async () => {
      // Get the singleton channel instance
      const channel = getPresenceChannel()

      // Track current user's presence
      channel.on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const usersMap = new Map<string, PresenceUser>()

        // Convert presence state to array and filter out current user
        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key] as unknown as PresenceUser[]
          presences.forEach((presence) => {
            if (presence.user_id !== userId) {
              // Use Map to deduplicate by user_id
              usersMap.set(presence.user_id, presence)
            }
          })
        })

        // Convert map to array
        const users = Array.from(usersMap.values())
        setActiveUsers(users)
      })

      // Only call subscribe() if not already subscribed
      if (!isPresenceChannelSubscribed()) {
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            markPresenceChannelSubscribed()
            // Track this user's presence
            await channel.track({
              user_id: userId,
              user_name: userName,
              avatar_url: avatarUrl,
              online_at: new Date().toISOString(),
            })

            // Update presence every 30 seconds
            interval = setInterval(async () => {
              if (isSubscribedRef.current) {
                await channel.track({
                  user_id: userId,
                  user_name: userName,
                  avatar_url: avatarUrl,
                  online_at: new Date().toISOString(),
                })
              }
            }, 30000)
          }
        })
      } else {
        // Still need to track this user even if channel already subscribed
        await channel.track({
          user_id: userId,
          user_name: userName,
          avatar_url: avatarUrl,
          online_at: new Date().toISOString(),
        })
      }

      isSubscribedRef.current = true
    }

    setupPresence()

    // Use the singleton subscription cleanup
    const unsubscribe = subscribeToPresenceChannel()

    return () => {
      isSubscribedRef.current = false
      if (interval) clearInterval(interval)
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userName, avatarUrl])

  return {
    activeUsers,
    currentUserId: userId,
    currentUserName: userName,
  }
}
