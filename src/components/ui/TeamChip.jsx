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
    // Parse hex color to RGB for transparent background
    const hexToRgb = (hexColor) => {
        if (!hexColor) return { r: 107, g: 114, b: 128 } // Default gray
        const hex = hexColor.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return { r, g, b }
    }

    const { r, g, b } = hexToRgb(color)
    const solidColor = color || '#6B7280'

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                className
            )}
            style={{
                backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
                color: solidColor,
                border: `1px solid ${solidColor}`,
            }}
        >
            {name || 'Unknown'}
        </span>
    )
}
