import { useState, useEffect } from 'react'
import { hexToRgb } from '@/lib/utils'
import { Swords, Clock } from 'lucide-react'

/**
 * Parse rectangle coordinates from string format
 * @param {string} coords - Format: "topLeftX,topLeftY,bottomRightX,bottomRightY"
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
function parseRectCoords(coords) {
    if (!coords) return null
    const parts = coords.split(',').map(s => parseFloat(s.trim()))
    if (parts.length !== 4 || parts.some(isNaN)) return null
    const [x1, y1, x2, y2] = parts
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1)
    }
}

/**
 * Format a countdown from a future timestamp
 */
function formatCountdown(endTime) {
    if (!endTime) return null
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime)
    const now = new Date()
    const diff = end - now
    if (diff <= 0) return null
    const mins = Math.floor(diff / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * TerritoryRect - SVG overlay for territory on HQ map
 * 
 * @param {Object} props
 * @param {Object} props.territory - Territory data from Firestore
 * @param {Object} props.location - Location data with map_coords
 * @param {Object} props.ownerTeam - Owner team object { name, color }
 */
export function TerritoryRect({ territory, location, ownerTeam }) {
    const [countdown, setCountdown] = useState(null)

    const coords = parseRectCoords(location?.map_coords)
    if (!coords) return null

    const { x, y, width, height } = coords
    const minDimension = Math.min(width, height)

    // Team color processing
    const teamColor = ownerTeam?.color || '#6B7280'
    const { r, g, b } = hexToRgb(teamColor)

    // States
    const isUnderAttack = territory?.under_attack === true
    const hasCooldown = territory?.cooldown_ends_at && formatCountdown(territory.cooldown_ends_at)

    // Real-time countdown
    useEffect(() => {
        if (!territory?.cooldown_ends_at) {
            setCountdown(null)
            return
        }
        const interval = setInterval(() => {
            const cd = formatCountdown(territory.cooldown_ends_at)
            setCountdown(cd)
        }, 1000)
        return () => clearInterval(interval)
    }, [territory?.cooldown_ends_at])

    // Determine text display mode
    const renderText = () => {
        const centerX = x + width / 2
        const centerY = y + height / 2
        const locationName = location?.name || territory?.name || 'Territory'
        const gameName = territory?.name || ''
        const ownerName = ownerTeam?.name || 'Unclaimed'
        const stars = territory?.stars || 0

        // TINY: External label
        if (minDimension < 40) {
            const labelY = y > 200 ? y - 12 : y + height + 14
            return (
                <g className="external-label">
                    <line
                        x1={centerX}
                        y1={y > 200 ? y : y + height}
                        x2={centerX}
                        y2={labelY + (y > 200 ? 5 : -5)}
                        stroke={teamColor}
                        strokeWidth={1}
                        strokeDasharray="2,2"
                    />
                    <text
                        x={centerX}
                        y={labelY}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="600"
                        fill={teamColor}
                    >
                        {locationName} ({stars}⭐)
                    </text>
                </g>
            )
        }

        // MINIMAL: Stars only
        if (minDimension < 60) {
            return (
                <text
                    x={centerX}
                    y={centerY + 4}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#000"
                >
                    {stars}⭐
                </text>
            )
        }

        // COMPACT: Territory name + Stars
        if (minDimension < 100) {
            return (
                <g>
                    <text
                        x={centerX}
                        y={centerY - 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="#000"
                    >
                        {locationName.substring(0, 12)}
                    </text>
                    <text
                        x={centerX}
                        y={centerY + 10}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#000"
                    >
                        {stars}⭐
                    </text>
                </g>
            )
        }

        // FULL: All details
        const lineHeight = 13
        const startY = centerY - lineHeight * 1.5
        return (
            <g>
                <text x={centerX} y={startY} textAnchor="middle" fontSize="11" fontWeight="700" fill="#000">
                    {locationName.substring(0, 15)}
                </text>
                <text x={centerX} y={startY + lineHeight} textAnchor="middle" fontSize="9" fill="#333">
                    {gameName.substring(0, 18)}
                </text>
                <text x={centerX} y={startY + lineHeight * 2} textAnchor="middle" fontSize="9" fill={teamColor}>
                    {ownerName}
                </text>
                <text x={centerX} y={startY + lineHeight * 3} textAnchor="middle" fontSize="10" fill="#000">
                    {stars}⭐
                </text>
            </g>
        )
    }

    return (
        <g className="territory-rect">
            {/* Base rectangle */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={`rgba(${r}, ${g}, ${b}, 0.35)`}
                stroke={isUnderAttack ? '#ef4444' : teamColor}
                strokeWidth={isUnderAttack ? 3 : 1.5}
                rx={2}
                className={isUnderAttack ? 'animate-pulse' : ''}
            />

            {/* Text content */}
            {!hasCooldown && !isUnderAttack && renderText()}

            {/* Battle overlay */}
            {isUnderAttack && (
                <g className="battle-overlay">
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="rgba(239, 68, 68, 0.2)"
                        className="animate-pulse"
                    />
                    <foreignObject
                        x={x + width / 2 - 12}
                        y={y + height / 2 - 12}
                        width={24}
                        height={24}
                    >
                        <div className="flex items-center justify-center animate-pulse">
                            <Swords className="h-6 w-6 text-red-500" />
                        </div>
                    </foreignObject>
                </g>
            )}

            {/* Cooldown overlay */}
            {hasCooldown && !isUnderAttack && (
                <g className="cooldown-overlay">
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="rgba(255, 255, 255, 0.7)"
                    />
                    <foreignObject
                        x={x + width / 2 - 20}
                        y={y + height / 2 - 20}
                        width={40}
                        height={40}
                    >
                        <div className="flex flex-col items-center justify-center text-gray-600">
                            <Clock className="h-5 w-5" />
                            <span className="text-xs font-mono font-bold">{countdown}</span>
                        </div>
                    </foreignObject>
                </g>
            )}
        </g>
    )
}
