import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

export type Database = {
  public: {
    Tables: {
      sticky_notes: {
        Row: {
          id: string
          content: string
          position_x: number
          position_y: number
          color: string
          category: string
          votes: number
          voted_by: string[] // Array of user IDs who voted
          created_by: string
          created_by_name: string // Creator's display name
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          position_x?: number
          position_y?: number
          color?: string
          category?: string
          votes?: number
          voted_by?: string[]
          created_by: string
          created_by_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          position_x?: number
          position_y?: number
          color?: string
          category?: string
          votes?: number
          voted_by?: string[]
          created_by?: string
          created_by_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
