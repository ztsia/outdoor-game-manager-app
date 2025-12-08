import { useState, useEffect } from 'react'
import { doc, onSnapshot, collection, query, where, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'

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

        // Subscribe to team document
        const teamRef = doc(db, 'teams', teamId)
        const unsubTeam = onSnapshot(
            teamRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    setTeam({ id: snapshot.id, ...snapshot.data() })
                } else {
                    setTeam(null)
                }
                setLoading(false)
            },
            (err) => {
                console.error('Error fetching team:', err)
                setError(err)
                setLoading(false)
            }
        )

        // Subscribe to owned territories
        const territoriesQuery = query(
            collection(db, 'territories'),
            where('owner_id', '==', teamId)
        )
        const unsubTerritories = onSnapshot(
            territoriesQuery,
            (snapshot) => {
                const territoriesData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setTerritories(territoriesData)
            },
            (err) => {
                console.error('Error fetching territories:', err)
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
        const teamRef = doc(db, 'teams', teamId)
        await updateDoc(teamRef, { name: newName })
    }

    return { team, territories, loading, error, updateTeamName }
}
