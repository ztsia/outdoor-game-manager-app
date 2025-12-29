import { useState, useEffect, useMemo } from 'react'
import { subscribeToAllTerritories } from '@/services/gameService'

/**
 * Custom hook to fetch real-time game data (all territories)
 * and compute derived state like defending teams
 * @returns {Object} Territories, defending teams set, loading state
 */
export function useGameData() {
    const [territories, setTerritories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Subscribe to all territories via service
        const unsubscribe = subscribeToAllTerritories(
            (territoriesData) => {
                setTerritories(territoriesData)
                setLoading(false)
            },
            (err) => {
                setError(err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    // Compute defending teams - teams that have at least one territory under attack
    const defendingTeams = useMemo(() => {
        const teamsUnderAttack = new Set()
        territories.forEach((territory) => {
            if (territory.under_attack && territory.owner_id) {
                teamsUnderAttack.add(territory.owner_id)
            }
        })
        return teamsUnderAttack
    }, [territories])

    // Compute attacking teams - teams that have initiated an attack (requesting or accepted)
    const attackingTeams = useMemo(() => {
        const teamsAttacking = new Set()
        territories.forEach((territory) => {
            const status = territory.challenge_status
            if ((status === 'requesting' || status === 'accepted') && territory.current_attacker_id) {
                teamsAttacking.add(territory.current_attacker_id)
            }
        })
        return teamsAttacking
    }, [territories])

    return { territories, defendingTeams, attackingTeams, loading, error }
}
