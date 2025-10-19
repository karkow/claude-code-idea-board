-- Claude Code Idea Board Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table to recreate with new auth schema
DROP TABLE IF EXISTS sticky_notes;

-- Sticky notes table
CREATE TABLE sticky_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  position_x FLOAT NOT NULL DEFAULT 100,
  position_y FLOAT NOT NULL DEFAULT 100,
  color VARCHAR(7) NOT NULL DEFAULT '#fef3c7',
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  votes INTEGER NOT NULL DEFAULT 0,
  voted_by JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of user IDs who voted
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL, -- Creator's display name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make this script idempotent)
DROP POLICY IF EXISTS "Anyone can read sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Anyone can insert sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Anyone can update sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Anyone can delete sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Authenticated users can insert sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Authenticated users can update sticky notes" ON sticky_notes;
DROP POLICY IF EXISTS "Users can delete own sticky notes" ON sticky_notes;

-- Policy: Anyone (authenticated) can read sticky notes
CREATE POLICY "Anyone can read sticky notes"
  ON sticky_notes FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert sticky notes (relaxed for now)
CREATE POLICY "Authenticated users can insert sticky notes"
  ON sticky_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can update any sticky notes (for voting and dragging)
CREATE POLICY "Authenticated users can update sticky notes"
  ON sticky_notes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can delete sticky notes (relaxed for now)
CREATE POLICY "Users can delete own sticky notes"
  ON sticky_notes FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sticky_notes_created_at ON sticky_notes(created_at DESC);

-- Note: We're using Realtime Broadcast channels instead of Postgres Changes
-- This works on all Supabase tiers without requiring Replication to be enabled

-- Sample data will be created by authenticated users through the app
