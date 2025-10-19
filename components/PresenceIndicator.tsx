'use client'

import { PresenceUser } from '@/lib/types'
import { getInitials } from '@/lib/utils'
import { Users } from 'lucide-react'

interface PresenceIndicatorProps {
  users: PresenceUser[]
}

// Generate consistent colors for user avatars
function getUserColor(userId: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
  ]

  // Generate a consistent hash from user ID
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

export function PresenceIndicator({ users }: PresenceIndicatorProps) {
  const visibleUsers = users.slice(0, 5)
  const remainingCount = users.length - visibleUsers.length

  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Users className="h-4 w-4" />
        <span>Just you</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-slate-600" />
      <span className="text-sm text-slate-600">
        {users.length} {users.length === 1 ? 'person' : 'people'} online
      </span>
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.user_id}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white ${getUserColor(user.user_id)}`}
            title={user.user_name}
          >
            {getInitials(user.user_name)}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-500 text-xs font-medium text-white"
            title={`${remainingCount} more`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  )
}
