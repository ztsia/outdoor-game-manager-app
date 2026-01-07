import { useState, useEffect } from 'react'
import { hexToRgb } from '@/lib/utils'
import { FlagDisplay } from '@/components/ui/FlagDisplay'
import { TeamChip } from '@/components/ui/TeamChip'
import { TerritoryStatusBadge } from '@/components/game/TerritoryStatusBadge'
import { LeaderboardModal } from '@/components/game/LeaderboardModal'
import { Clock, Swords } from 'lucide-react'

/**
 * Parse point coordinates from string format
 * @param {string} coords - Format: "x,y"
 * @returns {{ x: number, y: number } | null}
 */
function parsePointCoords(coords) {
    if (!coords) return null
    const parts = coords.split(',').map(s => parseFloat(s.trim()))
    if (parts.length !== 2 || parts.some(isNaN)) return null
    return { x: parts[0], y: parts[1] }
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
 * Get game status for World Tour
 */
function getWorldTourStatus(game) {
    const isActive = game?.current_team_id && game?.live_state?.game_started
    const hasCooldown = game?.cooldown_ends_at && formatCountdown(game.cooldown_ends_at)

    if (isActive) {
        return {
            disabled: true,
            reason: 'Game in progress',
            badge: {
                icon: Swords,
                variant: 'destructive',
                text: 'PLAYING',
                className: 'bg-red-500'
            }
        }
    }

    if (hasCooldown) {
        return {
            disabled: true,
            reason: 'On cooldown',
            badge: {
                icon: Clock,
                variant: 'secondary',
                text: 'COOLDOWN'
            }
        }
    }

    return { disabled: false }
}

/**
 * WorldTourFlag - 2.5D flag marker for World Tour games on HQ map
 * 
 * @param {Object} props
 * @param {Object} props.game - World Tour game data from Firestore
 * @param {Object} props.location - Location data with map_coords and emoji
 * @param {Object} props.fanFavTeam - Fan favourite team object { name, color }
 * @param {Object} props.teamsMap - Map of team_id to team object
 * @param {Object} props.imageBounds - Rendered image bounds with scale
 * @param {Object} props.mapDimensions - Natural map dimensions
 */
export function WorldTourFlag({ game, location, fanFavTeam, teamsMap, imageBounds, mapDimensions }) {
    const [leaderboardOpen, setLeaderboardOpen] = useState(false)
    const [countdown, setCountdown] = useState(null)

    const coords = parsePointCoords(location?.map_coords)
    if (!coords) return null

    const { x, y } = coords

    // Team color
    const teamColor = fanFavTeam?.color || '#6B7280'
    const { r, g, b } = hexToRgb(teamColor)

    // Status
    const status = getWorldTourStatus(game)
    const isActive = status.badge?.text === 'PLAYING'
    const hasCooldown = game?.cooldown_ends_at && formatCountdown(game.cooldown_ends_at)

    // Real-time countdown
    useEffect(() => {
        if (!game?.cooldown_ends_at) {
            setCountdown(null)
            return
        }
        const interval = setInterval(() => {
            const cd = formatCountdown(game.cooldown_ends_at)
            setCountdown(cd)
        }, 1000)
        return () => clearInterval(interval)
    }, [game?.cooldown_ends_at])

    // Flag pole dimensions
    const basePoleHeight = 50
    const basePoleWidth = 3

    // Calculate scale for positioning
    const scale = imageBounds?.scale || 1
    const scaledX = x * scale
    const scaledY = y * scale
    const scaledPoleHeight = basePoleHeight * scale
    const scaledPoleWidth = Math.max(basePoleWidth * scale, 2)
    const scaledFlagSize = Math.max(20 * scale, 16)

    return (
        <>
            {/* Main flag container */}
            <div
                style={{
                    position: 'absolute',
                    left: scaledX,
                    top: scaledY,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 20,
                    cursor: 'pointer'
                }}
                onClick={() => setLeaderboardOpen(true)}
            >
                {/* Team chip above flag */}
                {fanFavTeam && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <TeamChip
                            name={fanFavTeam.name}
                            color={fanFavTeam.color}
                            className="text-[10px] px-1.5 py-0"
                        />
                    </div>
                )}

                {/* Status/cooldown badge */}
                {(status.disabled || (hasCooldown && !isActive && countdown)) && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        {status.disabled && <TerritoryStatusBadge status={status} />}
                        {hasCooldown && !isActive && countdown && (
                            <div className="flex items-center gap-1 bg-white/90 rounded px-1.5 py-0.5 text-xs font-mono shadow">
                                <Clock className="h-3 w-3 text-gray-500" />
                                {countdown}
                            </div>
                        )}
                    </div>
                )}

                {/* Flag image */}
                <div
                    className="rounded shadow-lg"
                    style={{
                        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
                        border: `2px solid ${teamColor}`,
                        padding: 2
                    }}
                >
                    <FlagDisplay value={location?.emoji} size={scaledFlagSize} />
                </div>

                {/* Flag pole */}
                <div
                    style={{
                        width: scaledPoleWidth,
                        height: scaledPoleHeight,
                        backgroundColor: teamColor,
                        margin: '0 auto',
                        borderRadius: '0 0 2px 2px',
                        boxShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}
                />

                {/* Ground marker */}
                <div
                    style={{
                        width: 8,
                        height: 8,
                        backgroundColor: teamColor,
                        borderRadius: '50%',
                        margin: '-4px auto 0',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                />

                {/* Active game pulsing border */}
                {isActive && (
                    <div
                        className="absolute inset-0 animate-pulse rounded"
                        style={{
                            border: '2px solid #ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            margin: -4
                        }}
                    />
                )}
            </div>

            {/* Leaderboard Modal */}
            <LeaderboardModal
                open={leaderboardOpen}
                onOpenChange={setLeaderboardOpen}
                attempts={game?.attempts || []}
                gameName={game?.name || location?.name || 'World Tour'}
                teamsMap={teamsMap}
            />
        </>
    )
}
