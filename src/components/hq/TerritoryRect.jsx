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

        // Dynamic font size calculation - bigger fonts while respecting borders
        const baseFontSize = Math.max(
            11,  // Minimum readable
            Math.min(
                Math.floor(availableWidth / 6),   // Width constraint (was /8)
                Math.floor(availableHeight / 10), // Height constraint (was /12)
                28   // Maximum size (was 22)
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


        // Detect 6-point polygon for special handling
        const is6PointPolygon = isPolygon && coords.points?.length === 6

        // Estimate content height to determine if we have enough space
        const lineHeight = baseFontSize * 1.3
        const fullContentHeight = lineHeight * 5 + 16 // 5 lines + gaps
        const minimalContentHeight = lineHeight * 2 + 8 // Name + stars + gaps
        const hasEnoughHeight = availableHeight >= fullContentHeight

        // For horizontal territories: check if height is sufficient
        const isShortHorizontal = isHorizontal && !hasEnoughHeight

        // Determine what to show based on size and shape
        const showGame = !isSmall && !is6PointPolygon && !isShortHorizontal
        const showOwner = !isSmall && !is6PointPolygon && !isShortHorizontal

        // Determine vertical alignment
        const useTopAlign = is6PointPolygon || isShortHorizontal

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
                        justifyContent: useTopAlign ? 'flex-start' : 'center',
                        height: '100%',
                        textAlign: 'center',
                        fontSize: `${baseFontSize}px`,
                        lineHeight: 1.3,
                        gap: isSmall ? '2px' : '4px',
                        paddingTop: useTopAlign ? '4px' : '0',
                        overflow: 'hidden'
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
                            WebkitLineClamp: isShortHorizontal ? 1 : 2,
                            WebkitBoxOrient: 'vertical',
                            width: '100%',
                            textShadow: '0 1px 2px rgba(255,255,255,0.8)'
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
                            color: '#000',
                            textShadow: '0 0 8px rgba(250, 204, 21, 0.8), 0 0 12px rgba(250, 204, 21, 0.5)',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                        }}
                    >
                        {renderStars(stars)}
                    </div>
                </div>
            </foreignObject>
        )
    }

    // Unique ID for gradients/filters
    const uniqueId = `territory-${location?.id || 'unknown'}`

    // Shared fill and stroke props
    const strokeColor = isUnderAttack ? '#ef4444' : teamColor
    const strokeWidth = isUnderAttack ? 3 : 2

    return (
        <g className="territory-rect">
            {/* Gradient and filter definitions */}
            <defs>
                <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={`rgba(${r}, ${g}, ${b}, 0.5)`} />
                    <stop offset="50%" stopColor={`rgba(${r}, ${g}, ${b}, 0.35)`} />
                    <stop offset="100%" stopColor={`rgba(${r}, ${g}, ${b}, 0.2)`} />
                </linearGradient>

                {/* Outer glow filter */}
                <filter id={`glow-${uniqueId}`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feColorMatrix in="blur" type="matrix"
                        values={`1 0 0 0 ${r / 255 * 0.3}
                                 0 1 0 0 ${g / 255 * 0.3}
                                 0 0 1 0 ${b / 255 * 0.3}
                                 0 0 0 0.6 0`}
                        result="coloredBlur"
                    />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Base shape with gradient fill */}
            {coords.type === 'rect' ? (
                <>
                    {/* Main fill with glow */}
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={`url(#grad-${uniqueId})`}
                        filter={`url(#glow-${uniqueId})`}
                        rx={4}
                    />
                    {/* Outer border */}
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        rx={4}
                    />
                    {/* Inner highlight */}
                    <rect
                        x={x + 2}
                        y={y + 2}
                        width={width - 4}
                        height={height - 4}
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.25)"
                        strokeWidth={1}
                        rx={3}
                    />
                </>
            ) : (
                <>
                    {/* Main fill with glow */}
                    <polygon
                        points={coords.pointsString}
                        fill={`url(#grad-${uniqueId})`}
                        filter={`url(#glow-${uniqueId})`}
                    />
                    {/* Outer border */}
                    <polygon
                        points={coords.pointsString}
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                    />
                </>
            )}

            {/* Battle overlay - pulsing red tint with border glow */}
            {isUnderAttack && (
                <g className="battle-overlay">
                    {/* Pulsing fill overlay */}
                    {coords.type === 'rect' ? (
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill="rgba(239, 68, 68, 0.25)"
                            rx={4}
                            className="animate-pulse-opacity"
                        />
                    ) : (
                        <polygon
                            points={coords.pointsString}
                            fill="rgba(239, 68, 68, 0.25)"
                            className="animate-pulse-opacity"
                        />
                    )}

                    {/* Animated border glow */}
                    {coords.type === 'rect' ? (
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill="transparent"
                            stroke="#ef4444"
                            strokeWidth={3}
                            rx={4}
                            className="animate-pulse"
                        />
                    ) : (
                        <polygon
                            points={coords.pointsString}
                            fill="transparent"
                            stroke="#ef4444"
                            strokeWidth={3}
                            className="animate-pulse"
                        />
                    )}
                </g>
            )}

            {/* Cooldown overlay - slow pulsing white with centered clock */}
            {hasCooldown && !isUnderAttack && (
                <g className="cooldown-overlay">
                    {/* Slow pulsing background */}
                    {coords.type === 'rect' ? (
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill="rgba(255, 255, 255, 0.6)"
                            rx={4}
                            className="animate-pulse-slow"
                        />
                    ) : (
                        <polygon
                            points={coords.pointsString}
                            fill="rgba(255, 255, 255, 0.6)"
                            className="animate-pulse-slow"
                        />
                    )}
                </g>
            )}

            {/* Text content - ALWAYS rendered on top */}
            {renderText()}

            {/* Battle - Large centered swords icon (no circle) */}
            {isUnderAttack && (
                <foreignObject
                    x={centerX - 24}
                    y={centerY - 24}
                    width={48}
                    height={48}
                >
                    <div className="flex items-center justify-center w-full h-full animate-pulse-visible">
                        <Swords className="h-10 w-10 text-red-600" style={{ filter: 'drop-shadow(0 2px 6px rgba(239,68,68,0.6))' }} />
                    </div>
                </foreignObject>
            )}

            {/* Cooldown - Large centered clock with timer (no circle) */}
            {hasCooldown && !isUnderAttack && (
                <foreignObject
                    x={centerX - 30}
                    y={centerY - 30}
                    width={60}
                    height={60}
                >
                    <div className="flex flex-col items-center justify-center w-full h-full gap-1 animate-scale-pulse">
                        <Clock className="h-8 w-8 text-gray-600" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }} />
                        <span className="text-sm font-mono font-bold text-gray-700" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{countdown}</span>
                    </div>
                </foreignObject>
            )}
        </g>
    )
}
