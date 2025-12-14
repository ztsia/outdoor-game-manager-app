import { useState, useEffect, useMemo } from 'react'
import { subscribeToAllTeams } from '@/services/teamService'

/**
 * Custom hook to fetch real-time data for all teams
 * @returns {Object} Teams array, teams map (keyed by ID), loading state, error
 */
export function useAllTeams() {
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const unsubscribe = subscribeToAllTeams(
            (teamsData) => {
                setTeams(teamsData)
                setLoading(false)
            },
            (err) => {
                setError(err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    // Create a map keyed by team ID for O(1) lookups
    const teamsMap = useMemo(() => {
        const map = {}
        teams.forEach((team) => {
            map[team.id] = team
        })
        return map
    }, [teams])

    return { teams, teamsMap, loading, error }
}
