'use client'

import { useState, useRef } from 'react'
import { StickyNote as StickyNoteType } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/utils'
import { ThumbsUp, Trash2 } from 'lucide-react'
import { useDraggable } from '@/lib/hooks/useDraggable'

interface StickyNoteProps {
  note: StickyNoteType
  onUpdate: (id: string, updates: Partial<StickyNoteType>) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onVote: (id: string) => Promise<boolean>
  currentUserId: string
  bounds?: { minX: number; minY: number; maxX: number; maxY: number }
}

export function StickyNote({ note, onUpdate, onDelete, onVote, currentUserId, bounds }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(note.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { position, isDragging, handleMouseDown } = useDraggable({
    initialPosition: { x: note.position_x, y: note.position_y },
    bounds,
    onDragEnd: async (pos) => {
      // Update position in database
      await onUpdate(note.id, {
        position_x: pos.x,
        position_y: pos.y,
      })
    },
  })

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditContent(note.content)
    setTimeout(() => {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }, 0)
  }

  const handleSave = async () => {
    if (editContent.trim() && editContent !== note.content) {
      await onUpdate(note.id, { content: editContent.trim() })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditContent(note.content)
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Delete this note?')) {
      await onDelete(note.id)
    }
  }

  const handleVote = async () => {
    await onVote(note.id)
  }

  const hasVoted = note.voted_by.includes(currentUserId)
  const categoryColor = CATEGORY_COLORS[note.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other

  return (
    <div
      className={`absolute w-64 rounded-lg shadow-md transition-shadow ${
        isDragging ? 'shadow-2xl cursor-grabbing' : 'shadow-md hover:shadow-lg'
      }`}
      style={{
        backgroundColor: note.color,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag handle header */}
      <div className="drag-handle cursor-grab rounded-t-lg p-3 pb-2">
        <div className="flex items-center justify-between">
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${categoryColor}`}>
            {note.category.replace('-', ' ')}
          </span>
          <button
            onClick={handleDelete}
            className="rounded p-1 hover:bg-black/10 transition-colors"
            title="Delete note"
          >
            <Trash2 className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full resize-none rounded border border-slate-300 bg-white/80 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            rows={4}
          />
        ) : (
          <p
            onDoubleClick={handleDoubleClick}
            className="min-h-[4rem] whitespace-pre-wrap text-sm text-slate-800 cursor-text"
            title="Double-click to edit"
          >
            {note.content}
          </p>
        )}
      </div>

      {/* Footer with vote button */}
      <div className="flex items-center justify-between border-t border-black/5 px-3 py-2">
        <button
          onClick={handleVote}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
            hasVoted
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'text-slate-600 hover:bg-black/10'
          }`}
          title={hasVoted ? "Click to remove your vote" : "Vote for this idea"}
        >
          <ThumbsUp className={`h-3 w-3 ${hasVoted ? 'fill-current' : ''}`} />
          <span>{note.votes}</span>
        </button>
        <span className="text-xs text-slate-500">
          by {note.created_by_name}
        </span>
      </div>
    </div>
  )
}
