import { useState, useEffect } from 'react'
import { getGameRules, initiateAttack as initiateAttackService } from '@/services/challengeService'

// Default tiered costs (fallback)
const DEFAULT_STAR_COSTS = {
    0: 10000,
    1: 50000,
    2: 100000,
    3: 500000
}

/**
 * Hook for handling attack transactions
 * Uses tiered pricing based on territory star count
 */
export function useAttackTransaction() {
    const [starCosts, setStarCosts] = useState(DEFAULT_STAR_COSTS)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Fetch star costs from system_config
    useEffect(() => {
        async function fetchConfig() {
            const rules = await getGameRules()
            setStarCosts(rules.starCosts || DEFAULT_STAR_COSTS)
        }
        fetchConfig()
    }, [])

    /**
     * Calculate attack cost based on territory stars using tiered pricing
     * @param {number} stars - Number of stars on territory
     * @returns {number} Total cost
     */
    const calculateCost = (stars) => {
        // Lookup in costs map, fallback to highest tier if not found
        const cost = starCosts[stars]
        if (cost !== undefined) {
            return cost
        }
        // Fallback: use highest available tier
        const maxStars = Math.max(...Object.keys(starCosts).map(Number))
        return starCosts[maxStars] || 500000
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
        starCosts,
        calculateCost,
        initiateAttack,
        loading,
        error
    }
}
