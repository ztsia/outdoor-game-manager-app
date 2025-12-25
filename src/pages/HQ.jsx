import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthProvider'
import { useAllTeams } from '@/hooks/useAllTeams'
import { useAllTerritories } from '@/hooks/useAllTerritories'
import { useAllWorldTourGames } from '@/hooks/useAllWorldTourGames'
import { getTeamRankInfo, RANKS, calculateTeamScore } from '@/services/rankService'
import { getGameRules } from '@/services/challengeService'
import { RankBadge } from '@/components/game/RankBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Swords, Clock, Trophy, Users, Star, Globe, MapPin, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

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
 * Territory/Game Card for War Room
 */
function BattleCard({ item, teamsMap, type = 'territory' }) {
    const [countdown, setCountdown] = useState(null)
    const isUnderAttack = item.under_attack === true
    const hasCooldown = item.cooldown_ends_at && formatCountdown(item.cooldown_ends_at)
    const hasLiveScore = item.live_state?.attacker_score > 0 || item.live_state?.defender_score > 0
    const owner = teamsMap[item.owner_id]
    const attacker = teamsMap[item.current_attacker_id]

    // Update countdown every second
    useEffect(() => {
        if (!item.cooldown_ends_at) return
        const interval = setInterval(() => {
            setCountdown(formatCountdown(item.cooldown_ends_at))
        }, 1000)
        return () => clearInterval(interval)
    }, [item.cooldown_ends_at])

    return (
        <Card className={cn(
            'relative overflow-hidden transition-all duration-300',
            isUnderAttack && 'ring-2 ring-red-500 animate-pulse'
        )}>
            {/* Cooldown Overlay */}
            {hasCooldown && !isUnderAttack && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <div className="text-center text-white">
                        <Clock className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-sm font-mono">{countdown || '...'}</p>
                    </div>
                </div>
            )}

            <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-1">
                        {type === 'worldtour' ? <Globe className="h-4 w-4 text-blue-500" /> : <MapPin className="h-4 w-4 text-muted-foreground" />}
                        {item.name || item.id}
                    </CardTitle>
                    {isUnderAttack && (
                        <Badge variant="destructive" className="text-xs">
                            <Swords className="h-3 w-3 mr-1" /> Battle!
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-1 space-y-1">
                {/* Owner */}
                {owner && (
                    <div className="flex items-center gap-1 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: owner.color }} />
                        <span className="text-muted-foreground">{owner.name}</span>
                    </div>
                )}
                {/* Stars */}
                {item.stars > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{item.stars} Stars</span>
                    </div>
                )}
                {/* Live Score */}
                {hasLiveScore && (
                    <div className="text-center font-bold text-lg">
                        <span className="text-red-500">{item.live_state.attacker_score}</span>
                        <span className="text-muted-foreground mx-1">-</span>
                        <span className="text-blue-500">{item.live_state.defender_score}</span>
                    </div>
                )}
                {/* Attacker info during battle */}
                {isUnderAttack && attacker && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>Attacker:</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: attacker.color }} />
                        <span>{attacker.name}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

/**
 * Animated Leaderboard Row with rank change detection
 */
function LeaderboardRow({ team, rank, index, isLivingIcon, score }) {
    const prevRankRef = useRef(rank)
    const [isRankChanged, setIsRankChanged] = useState(false)

    // Detect rank changes and trigger flash animation
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
                'flex items-center justify-between p-3 rounded-lg',
                index === 0 && 'bg-amber-500/10',
                index % 2 === 1 && !isRankChanged && 'bg-muted/50'
            )}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: team.color, color: 'white' }}>
                    {index + 1}
                </div>
                <div>
                    <p className="font-medium">{team.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{(team.followers || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
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
    const [config, setConfig] = useState(null)

    // Fetch game rules config
    useEffect(() => {
        async function fetchConfig() {
            const rules = await getGameRules()
            setConfig(rules)
        }
        fetchConfig()
    }, [])

    // Calculate leaderboard with ranks
    const leaderboard = useMemo(() => {
        if (!config || teams.length === 0) return []

        const RANK_ORDER = { [RANKS.LEGEND]: 3, [RANKS.RISING_STAR]: 2, [RANKS.ROOKIE]: 1, [RANKS.NONE]: 0 }

        // Calculate rank info for each team
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

        // Sort: Rank (desc) -> Score (desc)
        teamsWithRanks.sort((a, b) => {
            const rankDiff = (RANK_ORDER[b.rank] || 0) - (RANK_ORDER[a.rank] || 0)
            if (rankDiff !== 0) return rankDiff
            return b.score - a.score
        })

        return teamsWithRanks
    }, [teams, territories, config])

    const loading = teamsLoading || territoriesLoading || worldTourLoading || !config

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-muted-foreground">Loading HQ Dashboard...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        🎯 HQ War Room
                    </h1>
                    <p className="text-muted-foreground">Real-time game monitoring</p>
                </div>
                <Button variant="outline" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* War Room - Territories */}
                <div className="lg:col-span-2 space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                            <MapPin className="h-5 w-5" /> Territories
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {territories.map(territory => (
                                <BattleCard key={territory.id} item={territory} teamsMap={teamsMap} type="territory" />
                            ))}
                        </div>
                    </div>

                    {/* War Room - World Tour */}
                    <div>
                        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-500" /> World Tour Games
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {worldTourGames.map(game => (
                                <BattleCard key={game.id} item={game} teamsMap={teamsMap} type="worldtour" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div>
                    <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" /> Leaderboard
                    </h2>
                    <Card>
                        <CardContent className="p-2 space-y-1">
                            {leaderboard.map((team, index) => (
                                <LeaderboardRow
                                    key={team.id}
                                    team={team}
                                    rank={team.rank}
                                    score={team.score}
                                    isLivingIcon={team.isLivingIcon}
                                    index={index}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
