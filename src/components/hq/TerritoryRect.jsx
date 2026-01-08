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
        const renderStars = (count, fontSize = 12) => {
            const displayCount = Math.min(count, 5)
            return '⭐'.repeat(displayCount) + (count > 5 ? '+' : '')
        }

        // Aspect ratio detection
        const area = width * height
        const isVertical = height > width * 1.5
        const isHorizontal = width > height * 1.5
        const isPolygon = coords.type === 'polygon'

        // Size tiers based on area and dimensions
        const isTiny = minDimension < 35 || area < 1500
        const isSmall = minDimension < 55 || area < 3000
        const isMedium = area < 8000
        // else Large

        // TINY: External label
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
                        {locationName.substring(0, 10)} {renderStars(stars, 10)}
                    </text>
                </g>
            )
        }

        // SMALL: Name + Stars row
        if (isSmall) {
            const fontSize = isPolygon ? 11 : 13
            return (
                <g>
                    <text
                        x={centerX}
                        y={centerY - 2}
                        textAnchor="middle"
                        fontSize={fontSize}
                        fontWeight="600"
                        fill="#000"
                    >
                        {locationName.substring(0, 14)}
                    </text>
                    <text
                        x={centerX}
                        y={centerY + fontSize + 2}
                        textAnchor="middle"
                        fontSize={fontSize}
                        fill="#000"
                    >
                        {renderStars(stars, fontSize)}
                    </text>
                </g>
            )
        }

        // MEDIUM / LARGE with aspect-ratio awareness
        if (isVertical) {
            // VERTICAL LAYOUT - stacked with bigger fonts
            const baseFontSize = isMedium ? 14 : 18
            const lineHeight = isMedium ? 18 : 24
            const startY = centerY - lineHeight * 1.5

            return (
                <g>
                    <text x={centerX} y={startY} textAnchor="middle" fontSize={baseFontSize} fontWeight="700" fill="#000">
                        {locationName.substring(0, 20)}
                    </text>
                    {gameName && (
                        <text x={centerX} y={startY + lineHeight} textAnchor="middle" fontSize={baseFontSize - 3} fill="#555">
                            {gameName.substring(0, 22)}
                        </text>
                    )}
                    <text x={centerX} y={startY + lineHeight * 2} textAnchor="middle" fontSize={baseFontSize - 3} fill={teamColor} fontWeight="600">
                        {ownerName}
                    </text>
                    <text x={centerX} y={startY + lineHeight * 3} textAnchor="middle" fontSize={baseFontSize} fill="#000">
                        {renderStars(stars, baseFontSize)}
                    </text>
                </g>
            )
        }

        if (isHorizontal) {
            // HORIZONTAL LAYOUT - single/double line, compact
            const baseFontSize = isMedium ? 12 : 14
            const hasRoom = width > 180

            if (hasRoom) {
                // Two lines: name + game, then owner + stars
                return (
                    <g>
                        <text x={centerX} y={centerY - 6} textAnchor="middle" fontSize={baseFontSize} fontWeight="700" fill="#000">
                            {locationName.substring(0, 25)}{gameName ? ` · ${gameName.substring(0, 15)}` : ''}
                        </text>
                        <text x={centerX} y={centerY + baseFontSize} textAnchor="middle" fontSize={baseFontSize - 1} fill="#000">
                            <tspan fill={teamColor} fontWeight="600">{ownerName}</tspan>
                            <tspan fill="#000"> {renderStars(stars, baseFontSize)}</tspan>
                        </text>
                    </g>
                )
            } else {
                // Single line: name + stars
                return (
                    <text x={centerX} y={centerY + 4} textAnchor="middle" fontSize={baseFontSize} fontWeight="600" fill="#000">
                        {locationName.substring(0, 18)} {renderStars(stars, baseFontSize)}
                    </text>
                )
            }
        }

        // SQUARE / DEFAULT - balanced layout
        const baseFontSize = isMedium ? 12 : 15
        const lineHeight = isMedium ? 15 : 19
        const startY = centerY - lineHeight * 1.2

        // For polygons, use smaller text to avoid overflow
        const polyScale = isPolygon ? 0.85 : 1
        const adjustedFontSize = Math.round(baseFontSize * polyScale)
        const adjustedLineHeight = Math.round(lineHeight * polyScale)
        const maxChars = isPolygon ? 12 : 18

        return (
            <g>
                <text x={centerX} y={startY} textAnchor="middle" fontSize={adjustedFontSize + 1} fontWeight="700" fill="#000">
                    {locationName.substring(0, maxChars)}
                </text>
                {gameName && (
                    <text x={centerX} y={startY + adjustedLineHeight} textAnchor="middle" fontSize={adjustedFontSize - 1} fill="#555">
                        {gameName.substring(0, maxChars + 2)}
                    </text>
                )}
                <text x={centerX} y={startY + adjustedLineHeight * 2} textAnchor="middle" fontSize={adjustedFontSize - 1} fill={teamColor} fontWeight="600">
                    {ownerName.substring(0, maxChars)}
                </text>
                <text x={centerX} y={startY + adjustedLineHeight * 3} textAnchor="middle" fontSize={adjustedFontSize} fill="#000">
                    {renderStars(stars, adjustedFontSize)}
                </text>
            </g>
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
