import { useState, useEffect, useMemo } from 'react'
import { subscribeToAllWorldTourGames } from '@/services/gameService'

/**
 * Custom hook to fetch real-time data for all world tour games
 * @returns {Object} Games array, gamesMap, loading state, error
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

    // Create a map for O(1) lookups by game ID
    const gamesMap = useMemo(() => {
        const map = {}
        games.forEach((game) => {
            map[game.id] = game
        })
        return map
    }, [games])

    return { games, gamesMap, loading, error }
}
