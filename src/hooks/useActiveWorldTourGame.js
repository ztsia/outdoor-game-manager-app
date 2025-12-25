import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Hook to detect if a team has an active World Tour game in progress
 * @param {string} teamId - The team ID to check
 * @returns {{ activeGame: object | null, loading: boolean }}
 */
export function useActiveWorldTourGame(teamId) {
    const [activeGame, setActiveGame] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!teamId) {
            setActiveGame(null)
            setLoading(false)
            return
        }

        const q = query(
            collection(db, 'world_tour_games'),
            where('current_team_id', '==', teamId)
        )

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                if (snapshot.empty) {
                    setActiveGame(null)
                } else {
                    const doc = snapshot.docs[0]
                    setActiveGame({ id: doc.id, ...doc.data() })
                }
                setLoading(false)
            },
            (error) => {
                console.error('[useActiveWorldTourGame] Error:', error)
                setActiveGame(null)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [teamId])

    return { activeGame, loading }
}
