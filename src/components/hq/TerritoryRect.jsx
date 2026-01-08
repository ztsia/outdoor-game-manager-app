import { useState, useEffect } from 'react'
import { hexToRgb } from '@/lib/utils'
import { Swords, Clock } from 'lucide-react'

/**
 * Parse coordinates from string format - supports both rectangle and polygon
 * @param {string} coords - Format: "x1,y1,x2,y2" (rect) or "x1,y1,x2,y2,x3,y3,..." (polygon)
 * @returns {Object | null} Parsed coordinate object with type, dimensions, and center
 */
function parseCoords(coords) {
    if (!coords) return null
    const parts = coords.split(',').map(s => parseFloat(s.trim()))
    if (parts.some(isNaN) || parts.length < 4 || parts.length % 2 !== 0) return null

    if (parts.length === 4) {
        // Rectangle: x1,y1,x2,y2
        const [x1, y1, x2, y2] = parts
        const x = Math.min(x1, x2)
        const y = Math.min(y1, y2)
        const width = Math.abs(x2 - x1)
        const height = Math.abs(y2 - y1)
        return {
            type: 'rect',
            x, y, width, height,
            centerX: x + width / 2,
            centerY: y + height / 2
        }
    } else {
        // Polygon: x1,y1,x2,y2,x3,y3,...
        const points = []
        for (let i = 0; i < parts.length; i += 2) {
            points.push({ x: parts[i], y: parts[i + 1] })
        }
        const xs = points.map(p => p.x)
        const ys = points.map(p => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)

        // Calculate polygon centroid (geometric center)
        let cx = 0, cy = 0, signedArea = 0
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length
            const cross = points[i].x * points[j].y - points[j].x * points[i].y
            cx += (points[i].x + points[j].x) * cross
            cy += (points[i].y + points[j].y) * cross
            signedArea += cross
        }
        signedArea /= 2
        const centroidX = signedArea !== 0 ? cx / (6 * signedArea) : (minX + maxX) / 2
        const centroidY = signedArea !== 0 ? cy / (6 * signedArea) : (minY + maxY) / 2

        return {
            type: 'polygon',
            points,
            pointsString: points.map(p => `${p.x},${p.y}`).join(' '),
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: centroidX,
            centerY: centroidY
        }
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
 * TerritoryRect - SVG overlay for territory on HQ map (supports rect and polygon)
 * 
 * @param {Object} props
 * @param {Object} props.territory - Territory data from Firestore
 * @param {Object} props.location - Location data with map_coords
 * @param {Object} props.ownerTeam - Owner team object { name, color }
 */
export function TerritoryRect({ territory, location, ownerTeam }) {
    const [countdown, setCountdown] = useState(null)

    const coords = parseCoords(location?.map_coords)
    if (!coords) return null

    const { x, y, width, height, centerX, centerY } = coords
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

    // Determine text display mode with adaptive sizing
    const renderText = () => {
        const locationName = location?.name || territory?.name || 'Territory'
        const gameName = territory?.name || ''
        const ownerName = ownerTeam?.name || 'Unclaimed'
        const stars = territory?.stars || 0

        // Helper to render star icons instead of numbers
        const renderStars = (count) => {
            const displayCount = Math.min(count, 5)
            return '⭐'.repeat(displayCount) + (count > 5 ? '+' : '')
        }

        // Aspect ratio and size detection
        const area = width * height
        const isVertical = height > width * 1.5
        const isHorizontal = width > height * 1.5
        const isPolygon = coords.type === 'polygon'

        // Padding for safe text area
        const padding = isPolygon ? 15 : 8
        const availableWidth = width - padding * 2
        const availableHeight = height - padding * 2

        // Dynamic font size calculation
        const baseFontSize = Math.max(
            10,  // Minimum readable
            Math.min(
                Math.floor(availableWidth / 8),   // Width constraint
                Math.floor(availableHeight / 12), // Height constraint (for ~4 items)
                22   // Maximum size
            )
        )

        // Size tiers
        const isTiny = minDimension < 35 || area < 1500
        const isSmall = area < 3000
        const isMedium = area < 8000

        // TINY: External label (keep as SVG text)
        if (isTiny) {
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
                        fontSize="10"
                        fontWeight="600"
                        fill={teamColor}
                    >
                        {locationName.substring(0, 10)} {renderStars(stars)}
                    </text>
                </g>
            )
        }

        // For all other sizes, use foreignObject with HTML
        const contentX = x + padding
        const contentY = y + padding

        // Determine what to show based on size
        const showGame = !isSmall
        const showOwner = !isSmall

        return (
            <foreignObject
                x={contentX}
                y={contentY}
                width={availableWidth}
                height={availableHeight}
            >
                <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                        fontSize: `${baseFontSize}px`,
                        lineHeight: 1.3,
                        gap: isSmall ? '2px' : '4px'
                    }}
                >
                    {/* Location Name */}
                    <div
                        style={{
                            fontWeight: 700,
                            color: '#000',
                            fontSize: `${baseFontSize + 1}px`,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            width: '100%'
                        }}
                    >
                        {locationName}
                    </div>

                    {/* Game Name */}
                    {showGame && gameName && (
                        <div
                            style={{
                                fontSize: `${baseFontSize - 2}px`,
                                color: '#666',
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                width: '100%'
                            }}
                        >
                            {gameName}
                        </div>
                    )}

                    {/* Owner Name */}
                    {showOwner && (
                        <div
                            style={{
                                fontSize: `${baseFontSize - 2}px`,
                                color: teamColor,
                                fontWeight: 600,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                width: '100%'
                            }}
                        >
                            {ownerName}
                        </div>
                    )}

                    {/* Stars */}
                    <div
                        style={{
                            fontSize: `${baseFontSize}px`,
                            color: '#000'
                        }}
                    >
                        {renderStars(stars)}
                    </div>
                </div>
            </foreignObject>
        )
    }

    // Shared fill and stroke props
    const fillColor = `rgba(${r}, ${g}, ${b}, 0.35)`
    const strokeColor = isUnderAttack ? '#ef4444' : teamColor
    const strokeWidth = isUnderAttack ? 3 : 1.5

    return (
        <g className="territory-rect">
            {/* Base shape (rect or polygon) */}
            {coords.type === 'rect' ? (
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    rx={2}
                    className={isUnderAttack ? 'animate-pulse' : ''}
                />
            ) : (
                <polygon
                    points={coords.pointsString}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    className={isUnderAttack ? 'animate-pulse' : ''}
                />
            )}

            {/* Text content */}
            {!hasCooldown && !isUnderAttack && renderText()}

            {/* Battle overlay */}
            {isUnderAttack && (
                <g className="battle-overlay">
                    {coords.type === 'rect' ? (
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill="rgba(239, 68, 68, 0.2)"
                            className="animate-pulse"
                        />
                    ) : (
                        <polygon
                            points={coords.pointsString}
                            fill="rgba(239, 68, 68, 0.2)"
                            className="animate-pulse"
                        />
                    )}
                    <foreignObject
                        x={centerX - 12}
                        y={centerY - 12}
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
                    {coords.type === 'rect' ? (
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill="rgba(255, 255, 255, 0.7)"
                        />
                    ) : (
                        <polygon
                            points={coords.pointsString}
                            fill="rgba(255, 255, 255, 0.7)"
                        />
                    )}
                    <foreignObject
                        x={centerX - 20}
                        y={centerY - 20}
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
