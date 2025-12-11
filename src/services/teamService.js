/**
 * Team Service - Centralized Firestore operations for team data
 */
import { doc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Subscribe to a team document in real-time
 * @param {string} teamId - Team document ID (e.g., 'team_red')
 * @param {Function} callback - Called with team object or null
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTeam(teamId, callback, onError) {
    return onSnapshot(
        doc(db, 'teams', teamId),
        (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() })
            } else {
                callback(null)
            }
        },
        (err) => {
            console.error('[teamService] Error fetching team:', err)
            if (onError) onError(err)
        }
    )
}

/**
 * Subscribe to territories owned by a team in real-time
 * @param {string} teamId - Team document ID
 * @param {Function} callback - Called with array of territory objects
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTeamTerritories(teamId, callback, onError) {
    const q = query(
        collection(db, 'territories'),
        where('owner_id', '==', teamId)
    )

    return onSnapshot(
        q,
        (snapshot) => {
            const territories = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            callback(territories)
        },
        (err) => {
            console.error('[teamService] Error fetching territories:', err)
            if (onError) onError(err)
        }
    )
}

/**
 * Update team name
 * @param {string} teamId - Team document ID
 * @param {string} newName - New team name
 * @returns {Promise<void>}
 */
export async function updateTeamName(teamId, newName) {
    const teamRef = doc(db, 'teams', teamId)
    await updateDoc(teamRef, { name: newName })
}
