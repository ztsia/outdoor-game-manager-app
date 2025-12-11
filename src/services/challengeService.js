/**
 * Challenge Service - Centralized Firestore operations for attack/challenge logic
 */
import { doc, getDoc, runTransaction, collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Fetch global game rules from system_config
 * @returns {Promise<{starValue: number}>}
 */
export async function getGameRules() {
    try {
        const configDoc = await getDoc(doc(db, 'system_config', 'game_rules'))
        if (configDoc.exists()) {
            return { starValue: configDoc.data().star_value || 10000 }
        }
        return { starValue: 10000 }
    } catch (err) {
        console.error('[challengeService] Error fetching game rules:', err)
        return { starValue: 10000 }
    }
}

/**
 * Initiate an attack on a territory using a Firestore transaction
 * @param {string} territoryId - Territory to attack
 * @param {string} teamId - Attacking team ID
 * @param {number} cost - Calculated cost
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function initiateAttack(territoryId, teamId, cost) {
    try {
        await runTransaction(db, async (transaction) => {
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

            if (territory.challenge_status !== 'idle') {
                throw new Error('Territory is already under challenge')
            }
            if (team.followers < cost) {
                throw new Error('Insufficient followers')
            }
            if (territory.owner_id === teamId) {
                throw new Error('Cannot attack your own territory')
            }

            transaction.update(teamRef, {
                followers: team.followers - cost
            })

            transaction.update(territoryRef, {
                challenge_status: 'requesting',
                current_attacker_id: teamId,
                bet_amount: cost
            })
        })

        return { success: true }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

/**
 * Subscribe to incoming challenges on territories owned by a team
 * @param {string} teamId - Defending team ID
 * @param {Function} callback - Called with challenge object or null
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToIncomingChallenges(teamId, callback, onError) {
    const q = query(
        collection(db, 'territories'),
        where('owner_id', '==', teamId),
        where('challenge_status', '==', 'requesting')
    )

    return onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
            const fromCache = snapshot.metadata.fromCache
            console.log('[challengeService] Snapshot received:', {
                empty: snapshot.empty,
                size: snapshot.size,
                teamId,
                fromCache
            })

            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0]
                callback({
                    id: docSnap.id,
                    ...docSnap.data()
                })
            } else {
                callback(null)
            }
        },
        (err) => {
            console.error('[challengeService] Query error:', err)
            if (onError) onError(err)
        }
    )
}

/**
 * Accept a challenge - start the battle
 * @param {string} territoryId
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function acceptChallenge(territoryId) {
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
                under_attack: true
            })
        })

        return { success: true }
    } catch (err) {
        return { success: false, error: err.message }
    }
}

/**
 * Decline a challenge - refund attacker and reset territory
 * @param {string} territoryId
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function declineChallenge(territoryId) {
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

            transaction.update(territoryRef, {
                challenge_status: 'idle',
                current_attacker_id: null,
                bet_amount: 0
            })
        })

        return { success: true }
    } catch (err) {
        return { success: false, error: err.message }
    }
}
