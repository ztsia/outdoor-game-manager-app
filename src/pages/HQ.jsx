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
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Users, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import mapImage from '@/assets/map.png'

/**
 * Animated Leaderboard Row with rank change detection
 */
function LeaderboardRow({ team, rank, index, isLivingIcon }) {
    const prevRankRef = useRef(rank)
    const [isRankChanged, setIsRankChanged] = useState(false)

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
                scale: isRankChanged ? [1, 1.03, 1] : 1,
                backgroundColor: isRankChanged ? ['transparent', 'rgba(234, 179, 8, 0.3)', 'transparent'] : 'transparent'
            }}
            transition={{
                layout: { type: 'spring', stiffness: 300, damping: 30 },
                scale: { duration: 0.5 },
                backgroundColor: { duration: 1.5 }
            }}
            className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                index === 0 && 'bg-amber-500/10',
                index % 2 === 1 && !isRankChanged && 'bg-muted/50'
            )}
        >
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: team.color, color: 'white' }}>
                    {index + 1}
                </div>
                <div>
                    <p className="font-medium text-sm">{team.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{(team.followers || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <RankBadge rank={rank} isLivingIcon={isLivingIcon} />
        </motion.div>
    )
}

export default function HQ() {
    const { logout } = useAuth()
    const { teams, teamsMap, loading: teamsLoading } = useAllTeams()
    const { territories, loading: territoriesLoading } = useAllTerritories()
    const { worldTourGames, loading: worldTourLoading } = useAllWorldTourGames()
    const { locations, locationsMap, loading: locationsLoading } = useAllLocations()
    const [config, setConfig] = useState(null)
    const mapRef = useRef(null)
    const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 })

    // Fetch game rules config
    useEffect(() => {
        async function fetchConfig() {
            const rules = await getGameRules()
            setConfig(rules)
        }
        fetchConfig()
    }, [])

    // Track map image dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (mapRef.current) {
                setMapDimensions({
                    width: mapRef.current.naturalWidth || mapRef.current.width,
                    height: mapRef.current.naturalHeight || mapRef.current.height
                })
            }
        }

        const img = mapRef.current
        if (img) {
            if (img.complete) {
                updateDimensions()
            } else {
                img.onload = updateDimensions
            }
        }

        window.addEventListener('resize', updateDimensions)
        return () => window.removeEventListener('resize', updateDimensions)
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

    const loading = teamsLoading || territoriesLoading || worldTourLoading || locationsLoading || !config

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading HQ Dashboard...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        🎯 HQ War Room
                    </h1>
                    <p className="text-sm text-muted-foreground">Real-time game monitoring</p>
                </div>
                <Button variant="outline" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
            </div>

            {/* Main Content: Map + Leaderboard */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                {/* Map Container */}
                <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
                    {/* Map Image */}
                    <img
                        ref={mapRef}
                        src={mapImage}
                        alt="Game Map"
                        className="w-full h-auto"
                    />

                    {/* SVG Overlay for Territories */}
                    {mapDimensions.width > 0 && (
                        <svg
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            viewBox={`0 0 ${mapDimensions.width} ${mapDimensions.height}`}
                            preserveAspectRatio="xMidYMid meet"
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
                    {mapDimensions.width > 0 && (
                        <div
                            className="absolute top-0 left-0 w-full h-full"
                            style={{
                                transform: `scale(${mapRef.current?.clientWidth / mapDimensions.width || 1})`,
                                transformOrigin: 'top left'
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
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Leaderboard (Right Side) */}
                <div className="lg:w-80 flex-shrink-0">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" /> Leaderboard
                    </h2>
                    <Card className="h-[calc(100vh-200px)] overflow-y-auto">
                        <CardContent className="p-2 space-y-1">
                            {leaderboard.map((team, index) => (
                                <LeaderboardRow
                                    key={team.id}
                                    team={team}
                                    rank={team.rank}
                                    isLivingIcon={team.isLivingIcon}
                                    index={index}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Message Panel (Placeholder) */}
            <div className="border-t p-3 bg-muted/50">
                <div className="text-center text-sm text-muted-foreground">
                    📢 Message Panel - Coming Soon
                </div>
            </div>
        </div>
    )
}
