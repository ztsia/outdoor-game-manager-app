import { useState, useEffect } from 'react'
import { subscribeToTeam, subscribeToTeamTerritories, updateTeamName as updateTeamNameService } from '@/services/teamService'

/**
 * Custom hook to fetch real-time team data and owned territories
 * @param {string} teamId - The team document ID (e.g., 'team_red')
 * @returns {Object} Team data, territories, loading state, and update function
 */
export function useTeamData(teamId) {
    const [team, setTeam] = useState(null)
    const [territories, setTerritories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!teamId) {
            setLoading(false)
            return
        }

        // Subscribe to team document via service
        const unsubTeam = subscribeToTeam(
            teamId,
            (teamData) => {
                setTeam(teamData)
                setLoading(false)
            },
            (err) => {
                setError(err)
                setLoading(false)
            }
        )

        // Subscribe to owned territories via service
        const unsubTerritories = subscribeToTeamTerritories(
            teamId,
            (territoriesData) => {
                setTerritories(territoriesData)
            },
            (err) => {
                setError(err)
            }
        )

        // Cleanup subscriptions
        return () => {
            unsubTeam()
            unsubTerritories()
        }
    }, [teamId])

    // Function to update team name
    const updateTeamName = async (newName) => {
        if (!teamId) return
        await updateTeamNameService(teamId, newName)
    }

    return { team, territories, loading, error, updateTeamName }
}
