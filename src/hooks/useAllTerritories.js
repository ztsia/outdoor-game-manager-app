import { useState, useEffect } from 'react'
import { subscribeToAllTerritories } from '@/services/gameService'

/**
 * Custom hook to fetch real-time data for all territories
 * @returns {Object} Territories array, loading state, error
 */
export function useAllTerritories() {
    const [territories, setTerritories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
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

    return { territories, loading, error }
}
