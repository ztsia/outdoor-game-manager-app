import { useState, useEffect } from 'react'
import { subscribeToAllWorldTourGames } from '@/services/gameService'

/**
 * Custom hook to fetch real-time data for all world tour games
 * @returns {Object} World tour games array, loading state, error
 */
export function useAllWorldTourGames() {
    const [worldTourGames, setWorldTourGames] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const unsubscribe = subscribeToAllWorldTourGames(
            (gamesData) => {
                setWorldTourGames(gamesData)
                setLoading(false)
            },
            (err) => {
                setError(err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    return { worldTourGames, loading, error }
}
