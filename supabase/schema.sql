-- Claude Code Idea Board Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ==============================================================================
-- FULL SCHEMA (Fresh Install) - This will DELETE all existing data
-- ==============================================================================
-- Run this section if you're setting up the database for the first time
-- or if you want to completely reset it (all data will be lost)
-- ==============================================================================

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

-- Trigger function to automatically sync votes count with voted_by array length
CREATE OR REPLACE FUNCTION sync_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.votes := jsonb_array_length(NEW.voted_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update votes count on insert or update
DROP TRIGGER IF EXISTS sync_votes_count_trigger ON sticky_notes;
CREATE TRIGGER sync_votes_count_trigger
BEFORE INSERT OR UPDATE OF voted_by ON sticky_notes
FOR EACH ROW
EXECUTE FUNCTION sync_votes_count();

-- Note: We're using Realtime Broadcast channels instead of Postgres Changes
-- This works on all Supabase tiers without requiring Replication to be enabled

-- Sample data will be created by authenticated users through the app


-- ==============================================================================
-- MIGRATION ONLY (Add vote sync trigger to existing database)
-- ==============================================================================
-- Run this section INSTEAD of the full schema above if:
-- 1. Your table already exists
-- 2. You want to KEEP your existing data
-- 3. You just want to add the vote count trigger
-- ==============================================================================
-- Just uncomment and run these lines:
-- ==============================================================================

-- -- Add the trigger function (if not exists)
-- CREATE OR REPLACE FUNCTION sync_votes_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.votes := jsonb_array_length(NEW.voted_by);
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Add the trigger
-- DROP TRIGGER IF EXISTS sync_votes_count_trigger ON sticky_notes;
-- CREATE TRIGGER sync_votes_count_trigger
-- BEFORE INSERT OR UPDATE OF voted_by ON sticky_notes
-- FOR EACH ROW
-- EXECUTE FUNCTION sync_votes_count();

-- -- Fix all existing data to have correct vote counts
-- UPDATE sticky_notes
-- SET voted_by = voted_by; -- This triggers the sync function to recalculate votes
