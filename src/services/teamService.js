/**
 * Team Service - Centralized Firestore operations for team data
 */
import { doc, collection, query, where, onSnapshot, updateDoc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore'
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

/**
 * Subscribe to all teams in real-time
 * @param {Function} callback - Called with array of team objects
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAllTeams(callback, onError) {
    return onSnapshot(
        collection(db, 'teams'),
        (snapshot) => {
            const teams = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            callback(teams)
        },
        (err) => {
            console.error('[teamService] Error fetching all teams:', err)
            if (onError) onError(err)
        }
    )
}

/**
 * Generate next team ID (e.g., team_7)
 * @returns {Promise<string>}
 */
export async function getNextTeamId() {
    const snapshot = await getDocs(collection(db, 'teams'))
    let maxNum = 0
    snapshot.forEach(doc => {
        const match = doc.id.match(/^team_(\d+)$/)
        if (match) {
            maxNum = Math.max(maxNum, parseInt(match[1], 10))
        }
    })
    return `team_${maxNum + 1}`
}

/**
 * Create a new team
 * @param {Object} data - { name, color, followers }
 * @returns {Promise<string>} New team ID
 */
export async function createTeam(data) {
    const newId = await getNextTeamId()
    const teamRef = doc(db, 'teams', newId)

    await setDoc(teamRef, {
        name: data.name || 'New Team',
        color: data.color || '#888888',
        followers: data.followers || 0,
        territory_count: 0,
        fan_favourites: [],
        rank: null
    })

    console.log(`[teamService] Created team: ${newId}`)
    return newId
}

/**
 * Update an existing team
 * @param {string} teamId - Team document ID
 * @param {Object} data - Fields to update
 * @returns {Promise<void>}
 */
export async function updateTeam(teamId, data) {
    const teamRef = doc(db, 'teams', teamId)
    const updateData = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.color !== undefined) updateData.color = data.color
    if (data.followers !== undefined) updateData.followers = data.followers
    if (data.territory_count !== undefined) updateData.territory_count = data.territory_count
    if (data.fan_favourites !== undefined) updateData.fan_favourites = data.fan_favourites
    if (data.rank !== undefined) updateData.rank = data.rank

    await updateDoc(teamRef, updateData)
    console.log(`[teamService] Updated team: ${teamId}`)
}

/**
 * Delete a team
 * Note: This will also clear ownership from any territories owned by this team
 * @param {string} teamId - Team document ID
 * @returns {Promise<void>}
 */
export async function deleteTeam(teamId) {
    const batch = writeBatch(db)

    // Clear ownership from any territories owned by this team
    const territoriesQuery = query(
        collection(db, 'territories'),
        where('owner_id', '==', teamId)
    )
    const territoriesSnapshot = await getDocs(territoriesQuery)
    territoriesSnapshot.forEach(territoryDoc => {
        batch.update(territoryDoc.ref, { owner_id: null })
    })

    // Delete the team
    batch.delete(doc(db, 'teams', teamId))

    await batch.commit()
    console.log(`[teamService] Deleted team: ${teamId}`)
}

/**
 * Assign a territory to a team (transfer ownership)
 * @param {string} territoryId - Territory document ID
 * @param {string} newOwnerId - New owner team ID (or null to unassign)
 * @returns {Promise<void>}
 */
export async function assignTerritoryToTeam(territoryId, newOwnerId) {
    const territoryRef = doc(db, 'territories', territoryId)
    await updateDoc(territoryRef, { owner_id: newOwnerId })
    console.log(`[teamService] Assigned territory ${territoryId} to team ${newOwnerId}`)
}

