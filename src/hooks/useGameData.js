import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

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
        // Subscribe to all territories
        const unsubscribe = onSnapshot(
            collection(db, 'territories'),
            (snapshot) => {
                const territoriesData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setTerritories(territoriesData)
                setLoading(false)
            },
            (err) => {
                console.error('Error fetching territories:', err)
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

    return { territories, defendingTeams, loading, error }
}
