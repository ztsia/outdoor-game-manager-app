import { doc, runTransaction, onSnapshot, query, collection, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { useState, useEffect } from 'react'

/**
 * Hook for listening to and responding to challenge requests
 * Used by defenders to Accept/Decline incoming attacks
 */
export function useChallengeResponse(myTeamId) {
    const [incomingChallenge, setIncomingChallenge] = useState(null)
    const [loading, setLoading] = useState(false)

    // Listen for incoming challenges on territories owned by myTeamId
    useEffect(() => {
        if (!myTeamId) return

        const q = query(
            collection(db, 'territories'),
            where('owner_id', '==', myTeamId),
            where('challenge_status', '==', 'requesting')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('[useChallengeResponse] Snapshot received:', {
                empty: snapshot.empty,
                size: snapshot.size,
                myTeamId
            })

            if (!snapshot.empty) {
                // Get the first challenge (assume one at a time for now)
                const doc = snapshot.docs[0]
                const challengeData = {
                    id: doc.id,
                    ...doc.data()
                }
                console.log('[useChallengeResponse] Incoming challenge:', challengeData)
                setIncomingChallenge(challengeData)
            } else {
                console.log('[useChallengeResponse] No incoming challenges')
                setIncomingChallenge(null)
            }
        }, (error) => {
            console.error('[useChallengeResponse] Query error:', error)
        })

        return () => unsubscribe()
    }, [myTeamId])

    /**
     * Accept the challenge - start the battle
     * @param {string} territoryId 
     */
    const acceptChallenge = async (territoryId) => {
        setLoading(true)
        try {
            const territoryRef = doc(db, 'territories', territoryId)

            await runTransaction(db, async (transaction) => {
                const territorySnap = await transaction.get(territoryRef)
                if (!territorySnap.exists()) {
                    throw new Error('Territory not found')
                }

                const territory = territorySnap.data()
                if (territory.challenge_status !== 'requesting') {
                    throw new Error('Challenge is no longer active')
                }

                transaction.update(territoryRef, {
                    challenge_status: 'accepted',
                    under_attack: true  // Legacy compatibility
                })
            })

            setLoading(false)
            return { success: true }
        } catch (err) {
            setLoading(false)
            return { success: false, error: err.message }
        }
    }

    /**
     * Decline the challenge - refund attacker and reset territory
     * @param {string} territoryId 
     */
    const declineChallenge = async (territoryId) => {
        setLoading(true)
        try {
            const territoryRef = doc(db, 'territories', territoryId)

            await runTransaction(db, async (transaction) => {
                const territorySnap = await transaction.get(territoryRef)
                if (!territorySnap.exists()) {
                    throw new Error('Territory not found')
                }

                const territory = territorySnap.data()
                if (territory.challenge_status !== 'requesting') {
                    throw new Error('Challenge is no longer active')
                }

                const attackerId = territory.current_attacker_id
                const betAmount = territory.bet_amount || 0

                // Refund the attacker
                if (attackerId && betAmount > 0) {
                    const attackerRef = doc(db, 'teams', attackerId)
                    const attackerSnap = await transaction.get(attackerRef)

                    if (attackerSnap.exists()) {
                        const attacker = attackerSnap.data()
                        transaction.update(attackerRef, {
                            followers: attacker.followers + betAmount
                        })
                    }
                }

                // Reset territory state
                transaction.update(territoryRef, {
                    challenge_status: 'idle',
                    current_attacker_id: null,
                    bet_amount: 0
                })
            })

            setLoading(false)
            return { success: true }
        } catch (err) {
            setLoading(false)
            return { success: false, error: err.message }
        }
    }

    return {
        incomingChallenge,
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

        const unsubscribe = onSnapshot(
            doc(db, 'territories', territoryId),
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data()
                    setStatus(data.challenge_status)
                    setTerritory({ id: snapshot.id, ...data })
                }
            }
        )

        return () => unsubscribe()
    }, [territoryId])

    return { status, territory }
}
