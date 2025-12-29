import { useState, useEffect } from 'react'
import {
    subscribeToIncomingChallenges,
    acceptChallenge as acceptChallengeService,
    declineChallenge as declineChallengeService
} from '@/services/challengeService'
import { subscribeToTerritory } from '@/services/gameService'

/**
 * Hook for listening to and responding to challenge requests
 * Used by defenders to Accept/Decline incoming attacks
 */
export function useChallengeResponse(myTeamId) {
    const [incomingChallenges, setIncomingChallenges] = useState([])
    const [loading, setLoading] = useState(false)

    // Listen for incoming challenges on territories owned by myTeamId
    useEffect(() => {
        if (!myTeamId) return

        const unsubscribe = subscribeToIncomingChallenges(
            myTeamId,
            (challengesData) => {
                if (challengesData && challengesData.length > 0) {
                    console.log('[useChallengeResponse] Incoming challenges:', challengesData)
                } else {
                    console.log('[useChallengeResponse] No incoming challenges')
                }
                setIncomingChallenges(challengesData || [])
            },
            (error) => {
                console.error('[useChallengeResponse] Query error:', error)
            }
        )

        return () => unsubscribe()
    }, [myTeamId])

    /**
     * Accept the challenge - start the battle
     * @param {string} territoryId 
     */
    const acceptChallenge = async (territoryId) => {
        setLoading(true)
        const result = await acceptChallengeService(territoryId)
        setLoading(false)
        return result
    }

    /**
     * Decline the challenge - refund attacker and reset territory
     * @param {string} territoryId 
     */
    const declineChallenge = async (territoryId) => {
        setLoading(true)
        const result = await declineChallengeService(territoryId)
        setLoading(false)
        return result
    }

    return {
        incomingChallenges,
        acceptChallenge,
        declineChallenge,
        loading
    }
}

/**
 * Hook for attacker to listen for challenge response
 * @param {string} territoryId - The territory being challenged
 */
export function useChallengeStatus(territoryId) {
    const [status, setStatus] = useState(null)
    const [territory, setTerritory] = useState(null)

    useEffect(() => {
        if (!territoryId) return

        const unsubscribe = subscribeToTerritory(
            territoryId,
            (territoryData) => {
                if (territoryData) {
                    setStatus(territoryData.challenge_status)
                    setTerritory(territoryData)
                }
            }
        )

        return () => unsubscribe()
    }, [territoryId])

    return { status, territory }
}
