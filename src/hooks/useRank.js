import { useState, useEffect, useMemo, useRef } from 'react'
import { useTeamData } from './useTeamData'
import { subscribeToAllTeams } from '@/services/teamService'
import { subscribeToAllTerritories } from '@/services/gameService'
import { getGameRules } from '@/services/challengeService'
import { getTeamRankInfo, updateTeamRank, RANKS } from '@/services/rankService'

/**
 * Hook to get a team's current rank and Living Icon status
 * Also persists rank changes to the database
 * @param {string} teamId - Team ID to get rank for
 * @returns {Object} { rank, isLivingIcon, score, loading }
 */
export function useRank(teamId) {
    const { team, territories: teamTerritories, loading: teamLoading } = useTeamData(teamId)
    const [allTeams, setAllTeams] = useState([])
    const [allTerritories, setAllTerritories] = useState([])
    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)

    // Track last persisted rank to avoid unnecessary writes
    const lastPersistedRank = useRef(null)

    // Fetch game rules config
    useEffect(() => {
        async function fetchConfig() {
            const rules = await getGameRules()
            setConfig(rules)
        }
        fetchConfig()
    }, [])

    // Subscribe to all teams (for Living Icon comparison)
    useEffect(() => {
        const unsubscribe = subscribeToAllTeams(
            (teams) => setAllTeams(teams),
            (err) => console.error('[useRank] Error fetching all teams:', err)
        )
        return () => unsubscribe()
    }, [])

    // Subscribe to all territories (for score calculation)
    useEffect(() => {
        const unsubscribe = subscribeToAllTerritories(
            (territories) => {
                setAllTerritories(territories)
                setLoading(false)
            },
            (err) => console.error('[useRank] Error fetching all territories:', err)
        )
        return () => unsubscribe()
    }, [])

    // Calculate rank info
    const rankInfo = useMemo(() => {
        if (!team || !config || allTeams.length === 0) {
            return { rank: null, isLivingIcon: false, score: 0 }
        }

        return getTeamRankInfo(team, teamTerritories, allTeams, allTerritories, config)
    }, [team, teamTerritories, allTeams, allTerritories, config])

    // Persist rank changes to database
    useEffect(() => {
        if (!teamId || !rankInfo.rank || loading || teamLoading) return

        // Only update if rank actually changed
        if (rankInfo.rank !== lastPersistedRank.current) {
            lastPersistedRank.current = rankInfo.rank
            updateTeamRank(teamId, rankInfo.rank)
        }
    }, [teamId, rankInfo.rank, loading, teamLoading])

    return {
        rank: rankInfo.rank,
        isLivingIcon: rankInfo.isLivingIcon,
        score: rankInfo.score,
        loading: loading || teamLoading || !config
    }
}

export { RANKS }

