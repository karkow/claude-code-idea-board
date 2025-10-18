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

1. **Client Components for Interactivity**: The Whiteboard and StickyNote components must be client components ('use client') for drag-and-drop and real-time updates.

2. **Custom Hooks Pattern**: Separate data fetching and real-time logic into custom hooks (`useNotes`, `usePresence`) for clean separation of concerns.

3. **Optimistic Updates**: Update UI immediately when user makes changes, then sync with Supabase to avoid lag.

4. **No Authentication Required**: Use browser-generated UUIDs for user identification to minimize friction. Store in localStorage.

## 📁 File Structure & Responsibilities

### `/app/page.tsx`

- Main page component (can be server component initially)
- Imports and renders the Whiteboard component
- Minimal logic, mostly layout

### `/components/Whiteboard.tsx`

- **Client component** ('use client')
- Main canvas component that holds all sticky notes
- Manages drag-and-drop for the canvas
- Uses `useNotes` hook for data
- Uses `usePresence` hook for showing active users
- Handles zoom/pan if needed (optional feature)

### `/components/StickyNote.tsx`

- **Client component**
- Individual draggable sticky note
- Props: id, content, position (x, y), color, category, votes, onDrag, onUpdate, onDelete, onVote
- Uses `react-draggable` or native drag events
- Inline editing on double-click
- Shows vote count and vote button

### `/components/AddNoteButton.tsx`

- **Client component**
- Floating action button (fixed position, bottom-right)
- Opens dialog/modal to add new note
- Form fields: content (textarea), category (select), color (color picker or preset)
- Calls Supabase insert on submit

### `/components/PresenceIndicator.tsx`

- **Client component**
- Shows avatars/names of currently active users
- Updates in real-time using presence data
- Fixed position (top-right corner)
- Displays count + avatars (colored circles with initials)

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
// 1. Fetches initial notes from Supabase
// 2. Subscribes to real-time changes (insert, update, delete)
// 3. Returns: notes array, loading state, error state
// 4. Provides methods: addNote, updateNote, deleteNote, voteNote

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchNotes();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("notes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sticky_notes" },
        handleRealtimeUpdate,
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { notes, loading, addNote, updateNote, deleteNote, voteNote };
}
```

### `/lib/hooks/usePresence.ts`

```typescript
// Custom hook that:
// 1. Generates/retrieves user ID from localStorage
// 2. Broadcasts presence every 3 seconds (heartbeat)
// 3. Subscribes to other users' presence
// 4. Returns: activeUsers array (excluding self)

export function usePresence() {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const userId = getUserId(); // from localStorage or generate

  useEffect(() => {
    // Broadcast presence
    const interval = setInterval(() => {
      supabase.channel("presence").track({
        user_id: userId,
        user_name: getUserName(),
        online_at: new Date().toISOString(),
      });
    }, 3000);

    // Subscribe to presence
    const channel = supabase
      .channel("presence")
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setActiveUsers(processPresenceState(state));
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  return activeUsers;
}
```

### `/lib/utils.ts`

```typescript
// Utility functions:
// - getUserId(): Get or create user ID (localStorage)
// - getUserName(): Get or generate user name (e.g., "User 1234")
// - getRandomColor(): Return random pastel color for notes
// - cn(): className utility (from shadcn/ui)
```

## 🗄 Database Schema

### File: `/supabase/schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sticky notes table
CREATE TABLE sticky_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  position_x FLOAT NOT NULL DEFAULT 100,
  position_y FLOAT NOT NULL DEFAULT 100,
  color VARCHAR(7) NOT NULL DEFAULT '#fef3c7',
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  votes INTEGER NOT NULL DEFAULT 0,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can read sticky notes"
  ON sticky_notes FOR SELECT
  USING (true);

-- Policy: Anyone can insert
CREATE POLICY "Anyone can insert sticky notes"
  ON sticky_notes FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can update
CREATE POLICY "Anyone can update sticky notes"
  ON sticky_notes FOR UPDATE
  USING (true);

-- Policy: Anyone can delete
CREATE POLICY "Anyone can delete sticky notes"
  ON sticky_notes FOR DELETE
  USING (true);

-- Index for faster queries
CREATE INDEX idx_sticky_notes_created_at ON sticky_notes(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sticky_notes;
```

**Important**: After running this schema, go to Supabase Dashboard > Database > Replication and ensure `sticky_notes` is enabled for realtime.

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
