# Claude Code Idea Board

A real-time collaborative whiteboard for collecting ideas and suggestions for the Claude Code presentation demo. Built to showcase creative problem-solving and collaborative features.

## 🎯 Project Overview

This app allows team members to:

- Add sticky notes with ideas and suggestions
- Drag and position notes anywhere on the canvas
- See real-time updates as others contribute
- Vote/like ideas to surface the best suggestions
- See who's currently active with live presence indicators
- Color-code ideas by category

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS
- **Database & Real-time**: Supabase
- **Deployment**: Vercel
- **Code Repository**: GitHub

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

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the schema from `supabase/schema.sql`
3. Get your project URL and anon key from Settings > API
4. Enable Realtime for the `sticky_notes` table in Database > Replication

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
│   ├── page.tsx                 # Main whiteboard page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── StickyNote.tsx           # Individual sticky note component
│   ├── Whiteboard.tsx           # Main whiteboard canvas
│   ├── AddNoteButton.tsx        # Button to add new notes
│   ├── PresenceIndicator.tsx    # Shows active users
│   └── CategoryFilter.tsx       # Filter by category
├── lib/
│   ├── supabase.ts              # Supabase client setup
│   ├── hooks/
│   │   ├── useNotes.ts          # Hook for notes data
│   │   └── usePresence.ts       # Hook for presence tracking
│   └── utils.ts                 # Utility functions
├── supabase/
│   └── schema.sql               # Database schema
├── CLAUDE.md                    # Instructions for Claude Code
└── README.md                    # This file
```

## 🗄 Database Schema

The app uses two main tables:

**sticky_notes**: Stores all the idea notes

- id, content, position_x, position_y, color, category, votes, created_by, created_at

**presence**: Tracks active users (ephemeral)

- user_id, user_name, cursor_x, cursor_y, last_seen

See `supabase/schema.sql` for the complete schema.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

Vercel will automatically deploy on every push to main.

## 🎨 Features

- ✅ Real-time collaborative editing
- ✅ Drag-and-drop sticky notes
- ✅ Color-coded categories
- ✅ Vote/like system
- ✅ Live presence indicators
- ✅ Responsive design (works on mobile)
- ✅ Persistent storage

## 📝 Usage for Presentation

1. Deploy the app and share the URL in your Slack channel
2. Ask team members to add their Claude Code demo ideas
3. Let ideas collect over the week
4. During the presentation, screen-share the board to show collected ideas
5. Pick the most voted/interesting ideas for your live demo

## 🤝 Contributing

This is a demo project for the Claude Code presentation. Feel free to suggest improvements or add features!

## 📄 License

MIT

## 🙋 Questions?

For questions about the project or Claude Code demo, reach out in the Slack channel!
