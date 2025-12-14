import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * TeamChip - A pill-shaped badge displaying a team's name with the team's color.
 * @param {object} props
 * @param {string} props.name - The team's display name.
 * @param {string} props.color - The team's hex color (e.g., "#EF4444").
 * @param {string} [props.className] - Optional additional class names.
 */
export function TeamChip({ name, color, className }) {
    // Determine text color based on background luminance for contrast
    const getContrastColor = (hexColor) => {
        if (!hexColor) return '#FFFFFF'
        const hex = hexColor.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        // Using perceived luminance formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return luminance > 0.5 ? '#000000' : '#FFFFFF'
    }

    const textColor = getContrastColor(color)

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                className
            )}
            style={{
                backgroundColor: color || '#6B7280', // Default gray if no color
                color: textColor,
            }}
        >
            {name || 'Unknown'}
        </span>
    )
}
