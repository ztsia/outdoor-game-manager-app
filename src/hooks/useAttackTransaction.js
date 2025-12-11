import { useState, useEffect } from 'react'
import { getGameRules, initiateAttack as initiateAttackService } from '@/services/challengeService'

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
            const rules = await getGameRules()
            setStarValue(rules.starValue)
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

        const result = await initiateAttackService(territoryId, teamId, cost)

        setLoading(false)
        if (!result.success) {
            setError(result.error)
        }
        return result
    }

    return {
        starValue,
        calculateCost,
        initiateAttack,
        loading,
        error
    }
}
