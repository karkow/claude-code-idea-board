# Claude Code Idea Board

A real-time collaborative whiteboard for collecting ideas and suggestions for the Claude Code presentation demo. Built to showcase creative problem-solving and collaborative features with Google OAuth authentication.

## 🎯 Project Overview

This app allows team members to:

- **Sign in with Google** - Secure authentication with Google accounts
- **Add sticky notes** with ideas and suggestions
- **Drag and position** notes anywhere on the canvas
- **See real-time updates** as others contribute (sub-second latency)
- **Vote on ideas** to surface the best suggestions (one vote per user, toggle to unvote)
- **See who's online** with live presence indicators showing real names and initials
- **Track creators** - Each note shows who created it with their Google name
- **Edit inline** - Double-click any note to edit content
- **Color-code ideas** by category (Web Apps, Automation, Data Analysis, Other)

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: Supabase Auth with Google OAuth
- **UI Library**: shadcn/ui + Tailwind CSS
- **Database & Real-time**: Supabase (PostgreSQL + Realtime Broadcast)
- **Deployment**: Vercel
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is sufficient)
- A Vercel account
- Git installed

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd claude-code-idea-board
npm install
```

### 2. Supabase Setup

#### 2.1 Create Project and Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the complete schema from `supabase/schema.sql`
3. Get your project URL and anon key from Settings > API

#### 2.2 Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:3000` (for local development)
6. Copy the Client ID and Client Secret
7. In Supabase Dashboard → Authentication → Providers:
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save configuration

### 3. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Project Structure

```
├── app/
│   ├── page.tsx                 # Main page with auth routing
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts         # OAuth callback handler
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── StickyNote.tsx           # Individual sticky note component
│   ├── Whiteboard.tsx           # Main whiteboard canvas
│   ├── AddNoteButton.tsx        # Button to add new notes
│   ├── PresenceIndicator.tsx    # Shows active users with initials
│   ├── LoginPage.tsx            # Google sign-in page
│   └── CategoryFilter.tsx       # Filter by category (optional)
├── lib/
│   ├── supabase.ts              # Supabase client setup
│   ├── auth/
│   │   └── AuthContext.tsx      # Authentication context provider
│   ├── hooks/
│   │   ├── useNotes.ts          # Hook for notes data (with auth)
│   │   ├── usePresence.ts       # Hook for presence tracking
│   │   └── useDraggable.ts      # Hook for drag-and-drop
│   ├── realtimeManager.ts       # Singleton channel manager
│   ├── types.ts                 # TypeScript type definitions
│   └── utils.ts                 # Utility functions
├── supabase/
│   └── schema.sql               # Database schema with RLS
├── CLAUDE.md                    # Instructions for Claude Code
└── README.md                    # This file
```

## 🗄 Database Schema

### sticky_notes Table

Stores all sticky note ideas with the following fields:

- `id` (UUID): Unique identifier
- `content` (TEXT): Note content
- `position_x`, `position_y` (FLOAT): Canvas position
- `color` (VARCHAR): Hex color code
- `category` (VARCHAR): Note category
- `votes` (INTEGER): Total vote count
- `voted_by` (JSONB): Array of user IDs who voted
- `created_by` (UUID): References `auth.users(id)` - Google user ID
- `created_by_name` (VARCHAR): Creator's display name from Google
- `created_at`, `updated_at` (TIMESTAMP): Timestamps

### Authentication

Uses Supabase Auth with Google OAuth:
- Users sign in with Google accounts
- User data stored in `auth.users` table (managed by Supabase)
- Row Level Security (RLS) ensures only authenticated users can create/modify notes

### Real-time Features

- **Broadcast Channels**: Notes sync via Supabase Realtime Broadcast
- **Presence Tracking**: Shows active users with their Google names/initials
- No database polling - all updates are instant via WebSockets

See `supabase/schema.sql` for the complete schema with RLS policies.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

Vercel will automatically deploy on every push to main.

## 🎨 Features

- ✅ **Google OAuth Authentication** - Secure sign-in with Google accounts
- ✅ **Real-time Collaboration** - See updates within 1 second via WebSockets
- ✅ **Drag-and-Drop** - Smooth sticky note positioning with optimistic updates
- ✅ **Vote System** - One vote per user, prevents double voting
- ✅ **Live Presence** - See who's online with real names and colored initials
- ✅ **Creator Attribution** - Each note shows who created it
- ✅ **Color-Coded Categories** - Organize ideas by type
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Persistent Storage** - All data saved in Supabase PostgreSQL
- ✅ **Row Level Security** - Database-level access control

## 📝 Usage for Presentation

1. Deploy the app and share the URL in your Slack channel
2. Ask team members to add their Claude Code demo ideas
3. Let ideas collect over the week
4. During the presentation, screen-share the board to show collected ideas
5. Pick the most voted/interesting ideas for your live demo

## 🤝 Contributing

This is a demo project for the Claude Code presentation. Feel free to suggest improvements or add features!

## ✅ Production Ready

This codebase has been thoroughly reviewed and optimized:

- ✅ **Zero TypeScript errors** - Full type safety throughout
- ✅ **Zero ESLint warnings** - Clean, production-ready code
- ✅ **Optimized builds** - 44.7 kB main bundle, 203 kB first load
- ✅ **Error handling** - Comprehensive error states and user feedback
- ✅ **Performance optimized** - Singleton channels, optimistic updates
- ✅ **Security hardened** - Row Level Security, proper authentication flow

### Recent Improvements

- Fixed critical presence channel bug for multi-user support
- Removed debug logging for cleaner production builds
- Added comprehensive error handling and user feedback
- Improved TypeScript type definitions for database schema
- Optimized React hooks and dependency arrays
- Added error state to login page for better UX

## 📄 License

MIT

## 🙋 Questions?

For questions about the project or Claude Code demo, reach out in the Slack channel!
