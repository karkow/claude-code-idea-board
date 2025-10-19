export type Category = 'web-apps' | 'automation' | 'data-analysis' | 'other'

export interface StickyNote {
  id: string
  content: string
  position_x: number
  position_y: number
  color: string
  category: Category
  votes: number
  voted_by: string[] // Array of user IDs who voted
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface PresenceUser {
  user_id: string
  user_name: string
  avatar_url?: string
  online_at: string
}

export type BroadcastAction =
  | { type: 'note_added'; note: StickyNote }
  | { type: 'note_updated'; note: StickyNote }
  | { type: 'note_deleted'; id: string }
  | { type: 'note_voted'; id: string; votes: number; voted_by: string[] }
