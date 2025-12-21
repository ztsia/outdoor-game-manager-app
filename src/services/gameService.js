/**
 * Game Service - Centralized Firestore operations for game data
 */
import { collection, doc, onSnapshot, getDoc } from 'firebase/firestore'
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

/**
 * Get team data by ID
 * @param {string} teamId - Team document ID (e.g., 'team_red')
 * @returns {Promise<Object|null>} Team data or null if not found
 */
export async function getTeam(teamId) {
    if (!teamId) return null

    const teamDoc = await getDoc(doc(db, 'teams', teamId))

    if (teamDoc.exists()) {
        return { id: teamDoc.id, ...teamDoc.data() }
    }
    return null
}

/**
 * Subscribe to all world tour games in real-time
 * @param {Function} callback - Called with array of world tour game objects
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAllWorldTourGames(callback, onError) {
    return onSnapshot(
        collection(db, 'world_tour_games'),
        (snapshot) => {
            const games = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            callback(games)
        },
        (err) => {
            console.error('[gameService] Error fetching world tour games:', err)
            if (onError) onError(err)
        }
    )
}

/**
 * Subscribe to all locations in real-time
 * @param {Function} callback - Called with array of location objects
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAllLocations(callback, onError) {
    return onSnapshot(
        collection(db, 'locations'),
        (snapshot) => {
            const locations = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            callback(locations)
        },
        (err) => {
            console.error('[gameService] Error fetching locations:', err)
            if (onError) onError(err)
        }
    )
}
