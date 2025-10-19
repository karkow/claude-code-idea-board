# Claude Code Instructions

This document provides comprehensive guidance for building and modifying the Claude Code Idea Board project.

## 🎯 Project Context

**Purpose**: A real-time collaborative whiteboard where team members can post, organize, and vote on ideas for a Claude Code presentation demo.

**Target Users**: Technical team members who will access via Slack link and contribute ideas over a week.

**Key Success Criteria**:

- Real-time updates (users see changes within 1 second)
- Intuitive UX (no instructions needed)
- Persistent storage (ideas saved for the week)
- Mobile-friendly (Slack users on phones)
- Visually impressive (sets high expectations for the demo)

## 🏗 Architecture Overview

### Tech Stack

- **Next.js 15** with App Router (server and client components)
- **Supabase** for PostgreSQL database and real-time subscriptions
- **shadcn/ui** for pre-built components (Button, Card, Dialog, etc.)
- **Tailwind CSS** for styling
- **TypeScript** for type safety

### Key Architectural Decisions

1. **Google OAuth Authentication**: Users sign in with Google accounts via Supabase Auth for secure identity management and real user attribution.

2. **Client Components for Interactivity**: The Whiteboard and StickyNote components must be client components ('use client') for drag-and-drop and real-time updates.

3. **Custom Hooks Pattern**: Separate data fetching and real-time logic into custom hooks (`useNotes`, `usePresence`, `useDraggable`) for clean separation of concerns.

4. **Optimistic Updates**: Update UI immediately when user makes changes, then sync with Supabase to avoid lag.

5. **Broadcast Channels Over Postgres Changes**: Use Supabase Realtime Broadcast instead of Postgres Changes for instant updates without database replication overhead.

6. **Singleton Channel Manager**: Prevent React Strict Mode from creating duplicate subscriptions with a singleton pattern for realtime channels.

7. **Vote Tracking**: Store voted user IDs in JSONB array to prevent double voting and show who voted.

## 📁 File Structure & Responsibilities

### `/app/page.tsx`

- Main page component with authentication routing
- Shows LoginPage for unauthenticated users
- Shows Whiteboard for authenticated users
- Uses `useAuth` hook to check authentication status

### `/app/auth/callback/route.ts`

- OAuth callback route handler
- Receives OAuth code from Google
- Redirects to home page after authentication
- Session is automatically handled by Supabase client

### `/lib/auth/AuthContext.tsx`

- React context provider for authentication
- Provides: user, session, signInWithGoogle(), signOut()
- Listens to auth state changes via `supabase.auth.onAuthStateChange`
- Wraps the entire app in `app/layout.tsx`

### `/components/LoginPage.tsx`

- Google sign-in button and landing page
- Calls `signInWithGoogle()` from AuthContext
- Shows loading state during authentication

### `/components/Whiteboard.tsx`

- **Client component** ('use client')
- Main canvas component that holds all sticky notes
- Gets authenticated user from `useAuth()` hook
- Passes userId and userName to `useNotes(userId, userName)`
- Uses `usePresence({ user })` to show active users with Google names
- Shows sign-out button in header
- Displays real user name from Google account

### `/components/StickyNote.tsx`

- **Client component**
- Individual draggable sticky note with `useDraggable` hook
- Props: note, onUpdate, onDelete, onVote, currentUserId
- Double-click to edit content inline
- Shows creator name (`created_by_name`) at bottom
- Vote button disabled if user already voted (checks `voted_by` array)
- Prevents own broadcasts from causing position jump during drag

### `/components/AddNoteButton.tsx`

- **Client component**
- Floating action button (fixed bottom-right)
- Receives `onAddNote` function as prop from Whiteboard
- Shares state with Whiteboard's useNotes hook (not independent)
- Form fields: content, category, color picker
- Shows form in Dialog modal from shadcn/ui

### `/components/PresenceIndicator.tsx`

- **Client component**
- Shows colored circles with user initials from Google names
- Updates in real-time via Supabase Presence
- Fixed position in header (top-right)
- Uses `getInitials()` to extract initials (e.g., "Peter Zellner" → "PZ")
- Each user gets consistent color based on their user ID hash

### `/components/CategoryFilter.tsx`

- **Client component** (optional feature)
- Toggle buttons for categories: All, Web Apps, Automation, Data Analysis, Other
- Filters visible notes by category

### `/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### `/lib/hooks/useNotes.ts`

```typescript
// Custom hook that:
// 1. Accepts userId and userName as parameters (from authenticated user)
// 2. Fetches initial notes from Supabase
// 3. Subscribes to Realtime Broadcast channel (not Postgres Changes)
// 4. Handles note_added, note_updated, note_deleted, note_voted events
// 5. Prevents duplicate notes in state
// 6. Returns: notes, loading, error, addNote, updateNote, deleteNote, voteNote

export function useNotes(userId: string, userName: string) {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Uses singleton channel from realtimeManager
  const channel = getNotesChannel();

  // Vote tracking checks voted_by array before allowing vote
  const voteNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note.voted_by.includes(userId)) {
      return false; // Already voted
    }
    // Add userId to voted_by array and increment votes
  };

  return { notes, loading, error, addNote, updateNote, deleteNote, voteNote, refetch };
}
```

### `/lib/hooks/usePresence.ts`

```typescript
// Custom hook that:
// 1. Accepts authenticated User object from Supabase Auth
// 2. Extracts userId, userName, and avatarUrl from user.user_metadata
// 3. Broadcasts presence every 30 seconds (heartbeat)
// 4. Subscribes to other users' presence via singleton channel
// 5. Returns: activeUsers array (excluding self)

export function usePresence({ user }: { user: User }) {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);

  const userId = user.id;
  const userName = user.user_metadata?.full_name || user.email || 'Anonymous';
  const avatarUrl = user.user_metadata?.avatar_url;

  // Track presence with real Google user data
  await channel.track({
    user_id: userId,
    user_name: userName,
    avatar_url: avatarUrl,
    online_at: new Date().toISOString(),
  });

  return { activeUsers, currentUserId: userId, currentUserName: userName };
}
```

### `/lib/hooks/useDraggable.ts`

```typescript
// Custom hook for drag-and-drop functionality:
// 1. Manages local position state during drag
// 2. Tracks isDragging state for visual feedback
// 3. Calls onDragEnd with final position
// 4. Prevents position updates from broadcasts during/after drag (justDragged flag)
// 5. Uses currentPosition ref to avoid stale closures
// 6. Only allows drag from elements with 'drag-handle' class

export function useDraggable({ initialPosition, onDragEnd }) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const justDragged = useRef(false); // Prevents jump after drag

  return { position, isDragging, handleMouseDown };
}
```

### `/lib/utils.ts`

```typescript
// Utility functions:
// - getInitials(name): Extract initials from name (e.g., "Peter Zellner" → "PZ")
// - getRandomColor(): Return random pastel color for notes
// - cn(): className utility (from shadcn/ui)
// - NOTE_COLORS: Predefined pastel colors for sticky notes
// - CATEGORY_COLORS: Tailwind classes for category badges
```

### `/lib/realtimeManager.ts`

```typescript
// Singleton channel manager to prevent duplicate subscriptions:
// - getNotesChannel(): Returns singleton broadcast channel for notes
// - getPresenceChannel(): Returns singleton presence channel
// - Prevents React Strict Mode from creating duplicate subscriptions
// - Tracks subscription state with flags
```

## 🗄 Database Schema

### File: `/supabase/schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table for clean recreation (if needed)
DROP TABLE IF EXISTS sticky_notes;

-- Sticky notes table with authentication
CREATE TABLE sticky_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  position_x FLOAT NOT NULL DEFAULT 100,
  position_y FLOAT NOT NULL DEFAULT 100,
  color VARCHAR(7) NOT NULL DEFAULT '#fef3c7',
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  votes INTEGER NOT NULL DEFAULT 0,
  voted_by JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of user IDs who voted
  created_by UUID REFERENCES auth.users(id) NOT NULL, -- Google user ID
  created_by_name VARCHAR(255) NOT NULL, -- Creator's display name from Google
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (authenticated) can read
CREATE POLICY "Anyone can read sticky notes"
  ON sticky_notes FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert sticky notes"
  ON sticky_notes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can update (for voting and dragging)
CREATE POLICY "Authenticated users can update sticky notes"
  ON sticky_notes FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy: Authenticated users can delete
CREATE POLICY "Users can delete own sticky notes"
  ON sticky_notes FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Index for faster queries
CREATE INDEX idx_sticky_notes_created_at ON sticky_notes(created_at DESC);
```

**Key Changes from Original**:
- Uses Supabase Auth (`auth.users`) instead of localStorage UUIDs
- `voted_by` JSONB array tracks who voted (prevents double voting)
- `created_by_name` stores Google display name
- RLS policies require authentication
- NO Realtime Replication needed (we use Broadcast channels instead)

## 🎨 Styling Guidelines

### Color Palette

```typescript
// Predefined sticky note colors (pastel shades)
const NOTE_COLORS = {
  yellow: "#fef3c7", // Default
  pink: "#fce7f3",
  blue: "#dbeafe",
  green: "#d1fae5",
  purple: "#e9d5ff",
  orange: "#fed7aa",
};

// Category colors for badges
const CATEGORY_COLORS = {
  "web-apps": "bg-blue-100 text-blue-800",
  automation: "bg-green-100 text-green-800",
  "data-analysis": "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};
```

### Component Styling Patterns

**StickyNote**:

- Rounded corners (rounded-lg)
- Drop shadow (shadow-lg on hover, shadow-md default)
- Min width: 200px, max width: 300px
- Padding: p-4
- Cursor: cursor-move when draggable
- Smooth transitions for drag/hover

**Whiteboard**:

- Full viewport height minus header
- Light grid background pattern (optional, subtle)
- Overflow: hidden with pan capability (or overflow: auto for simple version)

**AddNoteButton**:

- Fixed position: bottom-4 right-4
- Circular button with + icon
- Large: w-14 h-14
- shadcn/ui Button component with variant="default"

## 🔧 Implementation Steps

### Phase 1: Setup & Basic Structure

1. Initialize Next.js project with TypeScript
2. Install dependencies: `@supabase/supabase-js`, `shadcn/ui` components
3. Set up Supabase client in `/lib/supabase.ts`
4. Create database schema in Supabase SQL Editor
5. Set up environment variables

### Phase 2: Core Components

1. Create basic Whiteboard component (no drag-and-drop yet)
2. Create StickyNote component (static display)
3. Implement `useNotes` hook with initial data fetch
4. Display notes on whiteboard in their saved positions

### Phase 3: Real-time Functionality

1. Add Supabase real-time subscription in `useNotes` hook
2. Test by manually inserting data in Supabase dashboard
3. Verify notes appear in real-time for all users

### Phase 4: Interactivity

1. Implement drag-and-drop for sticky notes (use `react-draggable` or native events)
2. Update position in Supabase on drag end
3. Add inline editing (double-click to edit, blur to save)
4. Implement delete functionality (button or gesture)

### Phase 5: Adding Notes

1. Create AddNoteButton component with dialog
2. Form for content, category selection, color picker
3. Insert new note in Supabase with random position near center
4. Show new note immediately with optimistic update

### Phase 6: Voting & Filtering

1. Add vote button to each note
2. Increment votes in Supabase (with optimistic update)
3. Add CategoryFilter component
4. Filter displayed notes by category

### Phase 7: Presence

1. Implement `usePresence` hook
2. Show PresenceIndicator component
3. Display user count and avatars
4. Optional: Show cursor positions for extra wow-factor

### Phase 8: Polish

1. Add loading states (skeleton loaders)
2. Add empty state (when no notes exist)
3. Add animations (framer-motion for smooth transitions)
4. Responsive design (stack notes on mobile)
5. Error handling and retry logic

## 🧪 Testing Approach

### Manual Testing Checklist

- [ ] Add a note → appears immediately
- [ ] Drag note → position saves and syncs
- [ ] Edit note content → saves and syncs
- [ ] Delete note → removes for all users
- [ ] Vote on note → count increments for all users
- [ ] Open in two browser tabs → changes sync in <1 second
- [ ] Test on mobile device → touch interactions work
- [ ] Leave tab idle → presence updates correctly
- [ ] Refresh page → notes persist in positions

### Performance Considerations

- Limit initial note load to most recent 100 notes
- Use React.memo for StickyNote to prevent unnecessary re-renders
- Debounce drag position updates (save every 500ms, not on every pixel)
- Use CSS transforms for drag animation (better performance than top/left)

## 🚀 Deployment Checklist

### Pre-deployment

1. Verify environment variables are set
2. Run `npm run build` locally to check for errors
3. Test production build: `npm run start`
4. Ensure Supabase RLS policies are correct

### Vercel Deployment

1. Push to GitHub main branch
2. Import project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy
5. Test deployed URL thoroughly
6. Share URL in Slack channel

### Post-deployment Monitoring

- Check Supabase logs for any errors
- Monitor Vercel analytics for performance
- Watch for any user-reported issues in Slack

## 🐛 Common Issues & Solutions

**Issue**: Real-time updates not working

- Solution: Check Replication settings in Supabase Dashboard
- Verify RLS policies allow read/write
- Check browser console for subscription errors

**Issue**: Drag-and-drop laggy

- Solution: Use CSS transforms instead of top/left positioning
- Debounce Supabase updates (save position only on dragEnd)
- Use React.memo to prevent re-renders

**Issue**: Notes overlap or position incorrectly

- Solution: Implement collision detection
- Add "auto-arrange" button to spread notes evenly
- Use z-index to bring dragged note to front

**Issue**: User presence shows stale users

- Solution: Implement timeout (remove users not seen in >10 seconds)
- Use heartbeat pattern (update presence every 3 seconds)

## 📚 Additional Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [react-draggable](https://github.com/react-grid-layout/react-draggable)

## 💡 Optional Enhancements

If time permits or for extra wow-factor:

1. **Cursor Tracking**: Show other users' cursor positions in real-time
2. **Drawing Mode**: Simple pen tool to draw arrows or circles
3. **Note Connections**: Draw lines between related notes
4. **Export Feature**: Download board as image for presentation
5. **Templates**: Pre-populate categories based on Claude Code use cases
6. **Animations**: Smooth entrance animations for new notes
7. **Collaborative Editing**: Show when someone else is editing a note
8. **Rich Text**: Support for markdown or basic formatting
9. **Note History**: Show edit history/versions
10. **Reactions**: Add emoji reactions instead of just votes

## 🎯 Project Goals Reminder

The app should:

- **Amaze** the team before the presentation (set high expectations)
- **Engage** users to contribute ideas (low friction, fun to use)
- **Inform** the presentation (collect genuinely useful demo ideas)
- **Showcase** what's possible (meta: using Claude Code to build for Claude Code demo)

Good luck! The goal is to create something that makes everyone excited about what Claude Code can help them build. 🚀
