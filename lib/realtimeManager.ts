import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Singleton channel instances that survive React Strict Mode
let notesChannel: RealtimeChannel | null = null
let presenceChannel: RealtimeChannel | null = null
let notesSubscribers = 0
let presenceSubscribers = 0
let notesSubscribed = false
let presenceSubscribed = false

export function getNotesChannel() {
  if (!notesChannel) {
    notesChannel = supabase.channel('notes-sync', {
      config: {
        broadcast: { self: false },
        presence: { key: '' },
      },
    })
    notesSubscribed = false
  }
  return notesChannel
}

export function isNotesChannelSubscribed() {
  return notesSubscribed
}

export function markNotesChannelSubscribed() {
  notesSubscribed = true
}

export function subscribeToNotesChannel() {
  notesSubscribers++
  return () => {
    notesSubscribers--
    // Only unsubscribe when all components have unmounted
    if (notesSubscribers === 0 && notesChannel) {
      notesChannel.unsubscribe()
      notesChannel = null
      notesSubscribed = false
    }
  }
}

export function getPresenceChannel() {
  if (!presenceChannel) {
    // Note: Presence channel doesn't need userId in config - it's tracked per client
    // The key should be unique per client connection, not per user
    presenceChannel = supabase.channel('online-users')
    presenceSubscribed = false
  }
  return presenceChannel
}

export function isPresenceChannelSubscribed() {
  return presenceSubscribed
}

export function markPresenceChannelSubscribed() {
  presenceSubscribed = true
}

export function subscribeToPresenceChannel() {
  presenceSubscribers++
  return () => {
    presenceSubscribers--
    // Only unsubscribe when all components have unmounted
    if (presenceSubscribers === 0 && presenceChannel) {
      presenceChannel.untrack()
      presenceChannel.unsubscribe()
      presenceChannel = null
      presenceSubscribed = false
    }
  }
}
