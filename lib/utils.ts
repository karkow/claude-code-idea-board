import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Predefined sticky note colors (pastel shades)
export const NOTE_COLORS = {
  yellow: '#fef3c7',
  pink: '#fce7f3',
  blue: '#dbeafe',
  green: '#d1fae5',
  purple: '#e9d5ff',
  orange: '#fed7aa',
} as const

// Category colors for badges
export const CATEGORY_COLORS = {
  'web-apps': 'bg-blue-100 text-blue-800',
  'automation': 'bg-green-100 text-green-800',
  'data-analysis': 'bg-purple-100 text-purple-800',
  'other': 'bg-gray-100 text-gray-800',
} as const

export const CATEGORIES = ['web-apps', 'automation', 'data-analysis', 'other'] as const
export type Category = typeof CATEGORIES[number]

/**
 * Get or create a unique user ID from localStorage
 */
export function getUserId(): string {
  if (typeof window === 'undefined') return 'server'

  const storageKey = 'claude-idea-board-user-id'
  let userId = localStorage.getItem(storageKey)

  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem(storageKey, userId)
  }

  return userId
}

/**
 * Get or generate a user name from localStorage
 */
export function getUserName(): string {
  if (typeof window === 'undefined') return 'Server User'

  const storageKey = 'claude-idea-board-user-name'
  let userName = localStorage.getItem(storageKey)

  if (!userName) {
    const randomNum = Math.floor(Math.random() * 9999)
    userName = `User ${randomNum.toString().padStart(4, '0')}`
    localStorage.setItem(storageKey, userName)
  }

  return userName
}

/**
 * Set a custom user name (optional)
 */
export function setUserName(name: string): void {
  if (typeof window === 'undefined') return

  const storageKey = 'claude-idea-board-user-name'
  localStorage.setItem(storageKey, name)
}

/**
 * Get a random pastel color for sticky notes
 */
export function getRandomColor(): string {
  const colors = Object.values(NOTE_COLORS)
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Get initials from a user name for avatars
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
