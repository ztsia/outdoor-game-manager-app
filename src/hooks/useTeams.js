import { useState, useEffect, useMemo } from 'react'
import { subscribeToAllTeams } from '@/services/teamService'

/**
 * useTeams - Hook for subscribing to all teams
 * @returns {{ teams: Array, teamsMap: Object, loading: boolean }}
 */
export function useTeams() {
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = subscribeToAllTeams(
            (data) => {
                setTeams(data)
                setLoading(false)
            },
            (err) => {
                console.error('[useTeams] Error:', err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    // Create a map for O(1) lookups: { team_id: teamObject }
    const teamsMap = useMemo(() => {
        const map = {}
        teams.forEach((team) => {
            map[team.id] = team
        })
        return map
    }, [teams])

    return { teams, teamsMap, loading }
}
