import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthProvider'
import { useAllTeams } from '@/hooks/useAllTeams'
import { useAllTerritories } from '@/hooks/useAllTerritories'
import { useAllWorldTourGames } from '@/hooks/useAllWorldTourGames'
import { useAllLocations } from '@/hooks/useAllLocations'
import { getTeamRankInfo, RANKS } from '@/services/rankService'
import { getGameRules } from '@/services/challengeService'
import { RankBadge } from '@/components/game/RankBadge'
import { TerritoryRect } from '@/components/hq/TerritoryRect'
import { WorldTourFlag } from '@/components/hq/WorldTourFlag'
import { Button } from '@/components/ui/button'
import { Trophy, Users, LogOut } from 'lucide-react'
import { cn, hexToRgb } from '@/lib/utils'
import mapImage from '@/assets/map.png'

/**
 * Animated Leaderboard Row with team color background
 */
function LeaderboardRow({ team, rank, index, isLivingIcon }) {
    const prevRankRef = useRef(rank)
    const [isRankChanged, setIsRankChanged] = useState(false)

    // Get team color RGB for background
    const { r, g, b } = hexToRgb(team.color || '#888888')

    useEffect(() => {
        if (prevRankRef.current !== rank && prevRankRef.current !== null) {
            setIsRankChanged(true)
            const timer = setTimeout(() => setIsRankChanged(false), 1500)
            return () => clearTimeout(timer)
        }
        prevRankRef.current = rank
    }, [rank])

    return (
        <motion.div
            layout
            layoutId={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: 0,
                scale: isRankChanged ? [1, 1.03, 1] : 1
            }}
            transition={{
                layout: { type: 'spring', stiffness: 300, damping: 30 },
                scale: { duration: 0.5 }
            }}
            style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)` }}
            className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                isRankChanged && 'ring-2 ring-yellow-400'
            )}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-background/80 flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                </div>
                <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{team.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{(team.followers || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div className="shrink-0">
                <RankBadge rank={rank} isLivingIcon={isLivingIcon} />
            </div>
        </motion.div>
    )
}

export default function HQ() {
    const { logout } = useAuth()
    const { teams, teamsMap, loading: teamsLoading } = useAllTeams()
    const { territories, loading: territoriesLoading } = useAllTerritories()
    const { worldTourGames, loading: worldTourLoading } = useAllWorldTourGames()
    const { locationsMap, loading: locationsLoading } = useAllLocations()
    const [config, setConfig] = useState(null)
    const mapRef = useRef(null)
    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 })
    const [imageBounds, setImageBounds] = useState(null)

    // Message panel state
    const [messages, setMessages] = useState([])
    const prevDataRef = useRef({ territories: {}, worldTourGames: {}, livingIconTeam: null })

    // Fetch game rules config
    useEffect(() => {
        async function fetchConfig() {
            const rules = await getGameRules()
            setConfig(rules)
        }
        fetchConfig()
    }, [])

    // Track map image dimensions and calculate rendered bounds with polling
    useEffect(() => {
        let animationFrameId = null
        let attempts = 0
        const maxAttempts = 100 // ~1.6 seconds max wait

        const calculateBounds = () => {
            const img = mapRef.current
            if (!img) return false

            const naturalWidth = img.naturalWidth
            const naturalHeight = img.naturalHeight
            const containerWidth = img.clientWidth
            const containerHeight = img.clientHeight

            // If dimensions not ready, return false to retry
            if (!containerWidth || !containerHeight || !naturalWidth || !naturalHeight) {
                return false
            }

            setMapDimensions({ width: naturalWidth, height: naturalHeight })

            const imgRatio = naturalWidth / naturalHeight
            const containerRatio = containerWidth / containerHeight

            let renderedWidth, renderedHeight, offsetX, offsetY

            if (imgRatio > containerRatio) {
                // Image is wider - letterbox top/bottom
                renderedWidth = containerWidth
                renderedHeight = containerWidth / imgRatio
                offsetX = 0
                offsetY = (containerHeight - renderedHeight) / 2
            } else {
                // Image is taller - letterbox left/right
                renderedHeight = containerHeight
                renderedWidth = containerHeight * imgRatio
                offsetX = (containerWidth - renderedWidth) / 2
                offsetY = 0
            }

            setImageBounds({
                renderedWidth,
                renderedHeight,
                offsetX,
                offsetY,
                scale: renderedWidth / naturalWidth
            })
            return true
        }

        const tryCalculate = () => {
            if (calculateBounds()) return // Success

            attempts++
            if (attempts < maxAttempts) {
                animationFrameId = requestAnimationFrame(tryCalculate)
            }
        }

        const startCalculation = () => {
            attempts = 0
            animationFrameId = requestAnimationFrame(tryCalculate)
        }

        const img = mapRef.current
        if (img) {
            if (img.complete) {
                startCalculation()
            } else {
                img.onload = startCalculation
            }
        }

        // Use ResizeObserver for resize detection
        const resizeObserver = new ResizeObserver(() => {
            calculateBounds()
        })
        if (img) {
            resizeObserver.observe(img)
        }

        window.addEventListener('resize', calculateBounds)
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', calculateBounds)
            resizeObserver.disconnect()
        }
    }, [])

    // Calculate leaderboard with ranks
    const leaderboard = useMemo(() => {
        if (!config || teams.length === 0) return []

        const RANK_ORDER = { [RANKS.LEGEND]: 3, [RANKS.RISING_STAR]: 2, [RANKS.ROOKIE]: 1, [RANKS.NONE]: 0 }

        const teamsWithRanks = teams.map(team => {
            const teamTerritories = territories.filter(t => t.owner_id === team.id)
            const rankInfo = getTeamRankInfo(team, teamTerritories, teams, territories, config)
            return {
                ...team,
                rank: rankInfo.rank,
                score: rankInfo.score,
                isLivingIcon: rankInfo.isLivingIcon
            }
        })

        teamsWithRanks.sort((a, b) => {
            const rankDiff = (RANK_ORDER[b.rank] || 0) - (RANK_ORDER[a.rank] || 0)
            if (rankDiff !== 0) return rankDiff
            return b.score - a.score
        })

        return teamsWithRanks
    }, [teams, territories, config])

    // Get fan favourite team for each World Tour game
    const getFanFavTeam = (game) => {
        if (!game.attempts || game.attempts.length === 0) return null
        const sorted = [...game.attempts].sort((a, b) => b.score - a.score)
        return teamsMap[sorted[0]?.team_id] || null
    }

    // Event detection for messages
    useEffect(() => {
        const now = new Date()
        const newMessages = []

        // 1. Territory ownership changes
        territories.forEach(t => {
            const prev = prevDataRef.current.territories[t.id]
            if (prev?.owner_id && prev.owner_id !== t.owner_id) {
                const newOwner = teamsMap[t.owner_id]
                newMessages.push({
                    id: `terr-${t.id}-${now.getTime()}`,
                    type: 'TERRITORY_OWNERSHIP',
                    text: `${newOwner?.name || 'Unknown'} captured ${t.name}`,
                    color: newOwner?.color || '#888',
                    timestamp: now
                })
            }
            prevDataRef.current.territories[t.id] = { owner_id: t.owner_id }
        })

        // 2. World Tour fan favourite changes
        worldTourGames.forEach(g => {
            const fanFav = getFanFavTeam(g)?.id
            const prev = prevDataRef.current.worldTourGames[g.id]
            if (prev?.fanFav && prev.fanFav !== fanFav && fanFav) {
                const loc = locationsMap[g.location_id]
                const team = teamsMap[fanFav]
                newMessages.push({
                    id: `wt-${g.id}-${now.getTime()}`,
                    type: 'FAN_FAVOURITE',
                    text: `${team?.name || 'Unknown'} is Fan Favourite at ${loc?.name || 'World Tour'}`,
                    color: team?.color || '#888',
                    timestamp: now
                })
            }
            prevDataRef.current.worldTourGames[g.id] = { fanFav }
        })

        // 3. Living Icon changes
        const currentLivingIcon = leaderboard.find(t => t.isLivingIcon)?.id
        if (prevDataRef.current.livingIconTeam &&
            prevDataRef.current.livingIconTeam !== currentLivingIcon &&
            currentLivingIcon) {
            const team = teamsMap[currentLivingIcon]
            newMessages.push({
                id: `li-${now.getTime()}`,
                type: 'LIVING_ICON',
                text: `${team?.name || 'Unknown'} is the Living Icon!`,
                color: team?.color || '#888',
                timestamp: now,
                icon: '👑'
            })
        }
        prevDataRef.current.livingIconTeam = currentLivingIcon

        // Add new messages
        if (newMessages.length > 0) {
            setMessages(prev => [...prev, ...newMessages])
        }
    }, [territories, worldTourGames, leaderboard, teamsMap, locationsMap])

    // Periodic cleanup of old messages (> 30 min)
    useEffect(() => {
        const interval = setInterval(() => {
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
            setMessages(prev => prev.filter(m => m.timestamp > thirtyMinsAgo))
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    const loading = teamsLoading || territoriesLoading || worldTourLoading || locationsLoading || !config

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading HQ Dashboard...</p>
            </div>
        )
    }

    return (
        <div className="h-screen bg-background overflow-hidden relative">
            {/* Floating Logout Button */}
            <Button
                variant="outline"
                size="icon"
                className="absolute top-3 left-3 z-30 bg-background/80 backdrop-blur-sm"
                onClick={logout}
            >
                <LogOut className="h-4 w-4" />
            </Button>

            {/* Map Container (Full Screen) */}
            <div className="h-full pb-12 relative">
                {/* Map Image */}
                <img
                    ref={mapRef}
                    src={mapImage}
                    alt="Game Map"
                    className="w-full h-full object-contain"
                />

                {/* SVG Overlay for Territories */}
                {imageBounds && mapDimensions.width > 0 && (
                    <svg
                        className="absolute pointer-events-none"
                        style={{
                            left: imageBounds.offsetX,
                            top: imageBounds.offsetY,
                            width: imageBounds.renderedWidth,
                            height: imageBounds.renderedHeight
                        }}
                        viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
                        preserveAspectRatio="xMidYMid slice"
                    >
                        {territories.map(territory => {
                            const location = locationsMap[territory.location_id]
                            if (!location?.map_coords) return null
                            const ownerTeam = teamsMap[territory.owner_id]
                            return (
                                <TerritoryRect
                                    key={territory.id}
                                    territory={territory}
                                    location={location}
                                    ownerTeam={ownerTeam}
                                />
                            )
                        })}
                    </svg>
                )}

                {/* World Tour Flags Container */}
                {imageBounds && mapDimensions.width > 0 && (
                    <div
                        className="absolute pointer-events-auto"
                        style={{
                            left: imageBounds.offsetX,
                            top: imageBounds.offsetY,
                            width: imageBounds.renderedWidth,
                            height: imageBounds.renderedHeight,
                            overflow: 'visible',
                            zIndex: 15
                        }}
                    >
                        {worldTourGames.map(game => {
                            const location = locationsMap[game.location_id]
                            if (!location?.map_coords) return null
                            const fanFavTeam = getFanFavTeam(game)
                            return (
                                <WorldTourFlag
                                    key={game.id}
                                    game={game}
                                    location={location}
                                    fanFavTeam={fanFavTeam}
                                    teamsMap={teamsMap}
                                    imageBounds={imageBounds}
                                    mapDimensions={mapDimensions}
                                />
                            )
                        })}
                    </div>
                )}

                {/* Floating Leaderboard */}
                <div className="absolute top-3 right-3 w-auto min-w-64 max-w-[400px] max-h-[50vh] overflow-y-auto overflow-x-hidden bg-background/80 backdrop-blur-sm rounded-lg shadow-lg p-3 z-20">
                    <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
                    </h2>
                    <div className="space-y-1">
                        {leaderboard.map((team, index) => (
                            <LeaderboardRow
                                key={team.id}
                                team={team}
                                rank={team.rank}
                                isLivingIcon={team.isLivingIcon}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Rolling Message Panel */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-background/90 backdrop-blur-sm border-t overflow-hidden z-20">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        📢 Waiting for game events...
                    </div>
                ) : (
                    <div className="animate-marquee whitespace-nowrap flex items-center h-full gap-12 px-4">
                        {messages.map(msg => (
                            <span key={msg.id} className="flex items-center gap-2 text-sm">
                                <span className="font-semibold" style={{ color: msg.color }}>
                                    {msg.icon || '📢'} {msg.text}
                                </span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
