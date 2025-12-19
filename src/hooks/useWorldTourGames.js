import { useState, useEffect } from 'react'
import { subscribeToAllWorldTourGames } from '@/services/gameService'

/**
 * Custom hook to fetch real-time data for all world tour games
 * @returns {Object} Games array, loading state, error
 */
export function useWorldTourGames() {
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const unsubscribe = subscribeToAllWorldTourGames(
            (gamesData) => {
                setGames(gamesData)
                setLoading(false)
            },
            (err) => {
                setError(err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    return { games, loading, error }
}
