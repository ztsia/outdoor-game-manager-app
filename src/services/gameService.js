/**
 * Game Service - Centralized Firestore operations for game data
 */
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Subscribe to all territories in real-time
 * @param {Function} callback - Called with array of territory objects
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAllTerritories(callback, onError) {
    return onSnapshot(
        collection(db, 'territories'),
        (snapshot) => {
            const territories = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            callback(territories)
        },
        (err) => {
            console.error('[gameService] Error fetching territories:', err)
            if (onError) onError(err)
        }
    )
}

/**
 * Subscribe to a single territory in real-time
 * @param {string} territoryId - Territory document ID
 * @param {Function} callback - Called with territory object or null
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTerritory(territoryId, callback, onError) {
    return onSnapshot(
        doc(db, 'territories', territoryId),
        (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() })
            } else {
                callback(null)
            }
        },
        (err) => {
            console.error('[gameService] Error fetching territory:', err)
            if (onError) onError(err)
        }
    )
}
