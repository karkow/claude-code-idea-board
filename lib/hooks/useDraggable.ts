'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface UseDraggableOptions {
  initialPosition: Position
  onDragStart?: () => void
  onDragEnd?: (position: Position) => void
}

export function useDraggable({
  initialPosition,
  onDragStart,
  onDragEnd,
}: UseDraggableOptions) {
  const [position, setPosition] = useState<Position>(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<Position>({ x: 0, y: 0 })
  const elementStartPos = useRef<Position>(initialPosition)
  const currentPosition = useRef<Position>(initialPosition)
  const justDragged = useRef(false)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag on left mouse button
      if (e.button !== 0) return

      // Check if the target has the drag-handle class or is a child of it
      const target = e.target as HTMLElement
      if (!target.closest('.drag-handle')) return

      e.preventDefault()
      e.stopPropagation()

      dragStartPos.current = { x: e.clientX, y: e.clientY }
      elementStartPos.current = position
      setIsDragging(true)
      onDragStart?.()
    },
    [position, onDragStart]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      const newPosition = {
        x: elementStartPos.current.x + deltaX,
        y: elementStartPos.current.y + deltaY,
      }

      currentPosition.current = newPosition
      setPosition(newPosition)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      justDragged.current = true

      // Clear the flag after a short delay to allow broadcasts to settle
      setTimeout(() => {
        justDragged.current = false
      }, 500)

      onDragEnd?.(currentPosition.current)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onDragEnd])

  // Update position when initialPosition changes (for external updates)
  useEffect(() => {
    // Don't update position if we're dragging or just finished dragging
    if (isDragging || justDragged.current) {
      return
    }

    setPosition((prev) => {
      // Only update if position actually changed
      if (prev.x === initialPosition.x && prev.y === initialPosition.y) {
        return prev
      }
      currentPosition.current = initialPosition
      return initialPosition
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition.x, initialPosition.y, isDragging])

  return {
    position,
    isDragging,
    handleMouseDown,
  }
}
