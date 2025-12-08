import { useState, useEffect } from 'react'
import { doc, runTransaction, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Hook for handling attack transactions
 * Performs atomic operations to ensure consistency
 */
export function useAttackTransaction() {
    const [starValue, setStarValue] = useState(10000) // Default
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Fetch global star value from system_config
    useEffect(() => {
        async function fetchConfig() {
            try {
                const configDoc = await getDoc(doc(db, 'system_config', 'game_rules'))
                if (configDoc.exists()) {
                    setStarValue(configDoc.data().star_value || 10000)
                }
            } catch (err) {
                console.error('Error fetching star value:', err)
            }
        }
        fetchConfig()
    }, [])

    /**
     * Calculate attack cost based on territory stars
     * @param {number} stars - Number of stars on territory
     * @returns {number} Total cost
     */
    const calculateCost = (stars) => {
        return stars * starValue
    }

    /**
     * Initiate an attack on a territory
     * Uses Firestore transaction for atomic operations
     * @param {string} territoryId - Territory to attack
     * @param {string} teamId - Attacking team
     * @param {number} cost - Calculated cost
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    const initiateAttack = async (territoryId, teamId, cost) => {
        setLoading(true)
        setError(null)

        try {
            await runTransaction(db, async (transaction) => {
                // Read current state
                const territoryRef = doc(db, 'territories', territoryId)
                const teamRef = doc(db, 'teams', teamId)

                const territorySnap = await transaction.get(territoryRef)
                const teamSnap = await transaction.get(teamRef)

                if (!territorySnap.exists()) {
                    throw new Error('Territory not found')
                }
                if (!teamSnap.exists()) {
                    throw new Error('Team not found')
                }

                const territory = territorySnap.data()
                const team = teamSnap.data()

                // Validate territory is still available
                if (territory.under_attack) {
                    throw new Error('Territory is already under attack')
                }

                // Validate team has enough funds
                if (team.followers < cost) {
                    throw new Error('Insufficient followers')
                }

                // Cannot attack own territory
                if (territory.owner_id === teamId) {
                    throw new Error('Cannot attack your own territory')
                }

                // Perform writes
                transaction.update(teamRef, {
                    followers: team.followers - cost
                })

                transaction.update(territoryRef, {
                    under_attack: true,
                    current_attacker_id: teamId,
                    bet_amount: cost
                })
            })

            setLoading(false)
            return { success: true }
        } catch (err) {
            setLoading(false)
            setError(err.message)
            return { success: false, error: err.message }
        }
    }

    return {
        starValue,
        calculateCost,
        initiateAttack,
        loading,
        error
    }
}
