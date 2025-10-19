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
    console.log('[RealtimeManager] Creating notes channel for the first time')
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
  console.log('[RealtimeManager] Notes channel subscribers:', notesSubscribers)
  return () => {
    notesSubscribers--
    console.log('[RealtimeManager] Notes channel subscribers:', notesSubscribers)
    // Only unsubscribe when all components have unmounted
    if (notesSubscribers === 0 && notesChannel) {
      console.log('[RealtimeManager] All subscribers gone, unsubscribing notes channel')
      notesChannel.unsubscribe()
      notesChannel = null
      notesSubscribed = false
    }
  }
}

export function getPresenceChannel(userId: string) {
  if (!presenceChannel) {
    console.log('[RealtimeManager] Creating presence channel for the first time')
    presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId,
        },
      },
    })
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
  console.log('[RealtimeManager] Presence channel subscribers:', presenceSubscribers)
  return () => {
    presenceSubscribers--
    console.log('[RealtimeManager] Presence channel subscribers:', presenceSubscribers)
    // Only unsubscribe when all components have unmounted
    if (presenceSubscribers === 0 && presenceChannel) {
      console.log('[RealtimeManager] All subscribers gone, unsubscribing presence channel')
      presenceChannel.untrack()
      presenceChannel.unsubscribe()
      presenceChannel = null
      presenceSubscribed = false
    }
  }
}
