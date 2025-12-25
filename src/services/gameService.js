/**
 * Game Service - Centralized Firestore operations for game data
 */
import { collection, doc, onSnapshot, getDoc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore'
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

/**
 * Subscribe to a single world tour game in real-time
 * @param {string} gameId - World tour game document ID
 * @param {Function} callback - Called with game object or null
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToWorldTourGame(gameId, callback, onError) {
    return onSnapshot(
        doc(db, 'world_tour_games', gameId),
        (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() })
            } else {
                callback(null)
            }
        },
        (err) => {
            console.error('[gameService] Error fetching world tour game:', err)
            if (onError) onError(err)
        }
    )
}

// ==================== LOCATION CRUD ====================

/**
 * Get the next available location ID (e.g., loc_08 if loc_07 exists)
 * @returns {Promise<string>} Next location ID
 */
export async function getNextLocationId() {
    const snapshot = await getDocs(collection(db, 'locations'))
    let maxNum = 0

    snapshot.docs.forEach((doc) => {
        const match = doc.id.match(/^loc_(\d+)$/)
        if (match) {
            const num = parseInt(match[1], 10)
            if (num > maxNum) maxNum = num
        }
    })

    const nextNum = maxNum + 1
    return `loc_${nextNum.toString().padStart(2, '0')}`
}

/**
 * Create a new location
 * @param {Object} locationData - Location data (name, type, emoji, image_url)
 * @returns {Promise<string>} Created location ID
 */
export async function createLocation(locationData) {
    const locationId = await getNextLocationId()
    await setDoc(doc(db, 'locations', locationId), {
        name: locationData.name || '',
        type: locationData.type || 'territory',
        emoji: locationData.emoji || '',
        image_url: locationData.image_url || '',
        assigned_game_id: locationData.assigned_game_id || null
    })
    return locationId
}

/**
 * Update an existing location
 * @param {string} locationId - Location document ID
 * @param {Object} data - Fields to update
 */
export async function updateLocation(locationId, data) {
    await updateDoc(doc(db, 'locations', locationId), data)
}

/**
 * Delete a location
 * @param {string} locationId - Location document ID
 */
export async function deleteLocation(locationId) {
    await deleteDoc(doc(db, 'locations', locationId))
}
