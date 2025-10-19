'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NOTE_COLORS } from '@/lib/utils'

interface AddNoteButtonProps {
  onAddNote: (content: string, category: string, color: string) => Promise<unknown>
}

export function AddNoteButton({ onAddNote }: AddNoteButtonProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('other')
  const [color, setColor] = useState<string>(NOTE_COLORS.yellow)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await onAddNote(content.trim(), category, color)
      // Reset form
      setContent('')
      setCategory('other')
      setColor(NOTE_COLORS.yellow)
      setOpen(false)
    } catch (error) {
      console.error('Failed to add note:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Idea</DialogTitle>
            <DialogDescription>
              Share your idea for the Claude Code presentation demo
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Content textarea */}
            <div className="grid gap-2">
              <Label htmlFor="content">Your Idea</Label>
              <Textarea
                id="content"
                placeholder="E.g., Build a real-time collaborative whiteboard"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                required
                autoFocus
              />
            </div>

            {/* Category select */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-apps">Web Apps</SelectItem>
                  <SelectItem value="automation">Automation</SelectItem>
                  <SelectItem value="data-analysis">Data Analysis</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color picker */}
            <div className="grid gap-2">
              <Label>Note Color</Label>
              <div className="flex gap-2">
                {Object.entries(NOTE_COLORS).map(([name, colorValue]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setColor(colorValue)}
                    className={`h-10 w-10 rounded-full border-2 transition-all ${
                      color === colorValue
                        ? 'border-slate-900 scale-110'
                        : 'border-slate-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: colorValue }}
                    title={name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Idea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
