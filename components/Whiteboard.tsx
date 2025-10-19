'use client'

import { useNotes } from '@/lib/hooks/useNotes'
import { usePresence } from '@/lib/hooks/usePresence'
import { useAuth } from '@/lib/auth/AuthContext'
import { StickyNote } from './StickyNote'
import { AddNoteButton } from './AddNoteButton'
import { PresenceIndicator } from './PresenceIndicator'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'

export function Whiteboard() {
  const { user, signOut } = useAuth()

  // Debug: Log user object
  console.log('Whiteboard render - user:', user)
  console.log('Whiteboard render - user?.id:', user?.id)

  if (!user) {
    console.log('No user, returning null')
    return null
  }

  if (!user.id) {
    console.log('User exists but no ID, returning loading...')
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600 mx-auto"></div>
          <p className="text-slate-600">Loading user data...</p>
        </div>
      </div>
    )
  }

  const currentUserName = user.user_metadata?.full_name || user.email || 'Anonymous'
  const userId = user.id

  console.log('About to call useNotes with userId:', userId, 'userName:', currentUserName)

  const { notes, loading, error, addNote, updateNote, deleteNote, voteNote } = useNotes(userId, currentUserName)
  const { activeUsers } = usePresence({ user })

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600 mx-auto"></div>
          <p className="text-slate-600">Loading ideas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error: {error}</p>
          <p className="text-slate-600 text-sm mt-2">
            Check your Supabase connection
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Claude Code Idea Board
            </h1>
            <p className="text-sm text-slate-600">
              Share your ideas for the demo presentation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-600">
              Signed in as <span className="font-medium">{currentUserName}</span>
            </p>
            <PresenceIndicator users={activeUsers} />
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Whiteboard canvas */}
      <div className="relative h-[calc(100vh-80px)] w-full overflow-auto">
        <div className="relative min-h-full min-w-full p-8">
          {notes.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-xl font-medium text-slate-700 mb-2">
                  No ideas yet!
                </p>
                <p className="text-slate-500">
                  Click the + button to add your first idea
                </p>
              </div>
            </div>
          ) : (
            notes.map((note) => (
              <StickyNote
                key={note.id}
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onVote={voteNote}
                currentUserId={user.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Add note button */}
      <AddNoteButton onAddNote={addNote} />
    </div>
  )
}
