'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { StickyNote, BroadcastAction } from '@/lib/types'
import { getNotesChannel, subscribeToNotesChannel, isNotesChannelSubscribed, markNotesChannelSubscribed } from '@/lib/realtimeManager'

export function useNotes(userId: string, userName: string) {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)

  // Fetch all notes from the database
  const fetchNotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sticky_notes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setNotes(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notes')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  // Subscribe to broadcast channel for real-time updates
  useEffect(() => {
    if (isSubscribedRef.current) return

    const setupChannel = async () => {
      // Get the singleton channel instance
      const channel = getNotesChannel()
      channelRef.current = channel

      // Add event handlers for this component instance
      // Supabase allows multiple listeners on the same channel
      channel.on('broadcast', { event: 'note-change' }, (payload) => {
        const action = payload.payload as BroadcastAction

        switch (action.type) {
          case 'note_added':
            setNotes((prev) => {
              // Prevent duplicates
              if (prev.some(n => n.id === action.note.id)) return prev
              return [action.note, ...prev]
            })
            break

          case 'note_updated':
            setNotes((prev) =>
              prev.map((note) =>
                note.id === action.note.id ? action.note : note
              )
            )
            break

          case 'note_deleted':
            setNotes((prev) => prev.filter((note) => note.id !== action.id))
            break

          case 'note_voted':
            setNotes((prev) =>
              prev.map((note) =>
                note.id === action.id ? { ...note, votes: action.votes, voted_by: action.voted_by } : note
              )
            )
            break
        }
      })

      // Only call subscribe() if not already subscribed
      if (!isNotesChannelSubscribed()) {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            markNotesChannelSubscribed()
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            // Reset subscription state on error
            markNotesChannelSubscribed()
            setError('Real-time connection lost. Please refresh the page.')
          }
        })
      }

      isSubscribedRef.current = true
    }

    setupChannel()

    // Use the singleton subscription cleanup
    const unsubscribe = subscribeToNotesChannel()

    return () => {
      isSubscribedRef.current = false
      unsubscribe()
    }
  }, [])

  // Add a new note
  const addNote = async (
    content: string,
    category: string,
    color: string,
    position_x?: number,
    position_y?: number
  ): Promise<StickyNote | null> => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No active session. Please sign in again.')
      }

      if (!userId || !userName) {
        throw new Error('User information is missing. Please refresh the page.')
      }

      const newNote = {
        content,
        category,
        color,
        position_x: position_x ?? Math.random() * 400 + 200,
        position_y: position_y ?? Math.random() * 300 + 100,
        created_by: userId,
        created_by_name: userName,
        // Don't set votes - the database trigger will set it to 0 based on empty voted_by array
      }

      const { data, error } = await supabase
        .from('sticky_notes')
        .insert(newNote)
        .select()
        .single()

      if (error) throw error

      // Optimistically update local state first
      setNotes((prev) => [data, ...prev])

      // Broadcast to other clients using the same channel
      if (channelRef.current && isSubscribedRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'note-change',
          payload: { type: 'note_added', note: data } as BroadcastAction,
        })
      }

      return data
    } catch (err) {
      console.error('Error adding note:', err)
      setError(err instanceof Error ? err.message : 'Failed to add note')
      return null
    }
  }

  // Update an existing note
  const updateNote = async (
    id: string,
    updates: Partial<StickyNote>
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('sticky_notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Optimistically update local state first
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? data : note))
      )

      // Broadcast to other clients using the same channel
      if (channelRef.current && isSubscribedRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'note-change',
          payload: { type: 'note_updated', note: data } as BroadcastAction,
        })
      }

      return true
    } catch (err) {
      console.error('Error updating note:', err)
      setError(err instanceof Error ? err.message : 'Failed to update note')
      return false
    }
  }

  // Delete a note
  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sticky_notes')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Optimistically update local state first
      setNotes((prev) => prev.filter((note) => note.id !== id))

      // Broadcast to other clients using the same channel
      if (channelRef.current && isSubscribedRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'note-change',
          payload: { type: 'note_deleted', id } as BroadcastAction,
        })
      }

      return true
    } catch (err) {
      console.error('Error deleting note:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete note')
      return false
    }
  }

  // Vote or unvote on a note (toggle)
  const voteNote = async (id: string): Promise<boolean> => {
    try {
      // Get current note
      const note = notes.find((n) => n.id === id)
      if (!note) return false

      // Check if user already voted - if so, remove vote
      const hasVoted = note.voted_by.includes(userId)
      const newVotedBy = hasVoted
        ? note.voted_by.filter(uid => uid !== userId) // Remove vote
        : [...note.voted_by, userId] // Add vote

      // Update only voted_by - the database trigger will sync the votes count
      const { data, error } = await supabase
        .from('sticky_notes')
        .update({ voted_by: newVotedBy })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Use the data returned from database (which has the trigger-computed vote count)
      const updatedNote = data

      // Optimistically update local state with database result
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id ? updatedNote : note
        )
      )

      // Broadcast to other clients using the same channel
      if (channelRef.current && isSubscribedRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'note-change',
          payload: { type: 'note_voted', id, votes: updatedNote.votes, voted_by: updatedNote.voted_by } as BroadcastAction,
        })
      }

      return true
    } catch (err) {
      console.error('Error voting on note:', err)
      setError(err instanceof Error ? err.message : 'Failed to vote on note')
      return false
    }
  }

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    voteNote,
    refetch: fetchNotes,
  }
}
