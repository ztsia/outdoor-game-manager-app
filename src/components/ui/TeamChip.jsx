import * as React from 'react'
import { cn, hexToRgb } from '@/lib/utils'

/**
 * TeamChip - A pill-shaped badge displaying a team's name with the team's color.
 * @param {object} props
 * @param {string} props.name - The team's display name.
 * @param {string} props.color - The team's hex color (e.g., "#EF4444").
 * @param {string} [props.className] - Optional additional class names.
 */
export function TeamChip({ name, color, className }) {
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
