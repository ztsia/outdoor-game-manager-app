/**
 * Blind Box Service - Firestore operations for promotional codes
 */
import {
    collection,
    doc,
    onSnapshot,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    increment,
    runTransaction
} from 'firebase/firestore'
import { db } from '@/firebase'

/**
 * Subscribe to all blind box codes in real-time
 */
export function subscribeToBlindBoxCodes(callback, onError) {
    return onSnapshot(
        collection(db, 'blind_box_codes'),
        (snapshot) => {
            const codes = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))
            callback(codes)
        },
        onError
    )
}

/**
 * Create a new blind box code
 */
export async function createBlindBoxCode(data) {
    const codeId = `code_${Date.now()}`
    await setDoc(doc(db, 'blind_box_codes', codeId), {
        code: data.code.trim().toLowerCase(),
        amount: data.amount || 0,
        outcome_description: data.outcome_description || '',
        status: 'active',
        created_at: serverTimestamp(),
        redeemed_by: null,
        redeemed_at: null
    })
    return codeId
}

/**
 * Update an existing blind box code
 */
export async function updateBlindBoxCode(codeId, data) {
    const updates = {}
    if (data.code !== undefined) updates.code = data.code.trim().toLowerCase()
    if (data.amount !== undefined) updates.amount = data.amount
    if (data.outcome_description !== undefined) updates.outcome_description = data.outcome_description

    await updateDoc(doc(db, 'blind_box_codes', codeId), updates)
}

/**
 * Toggle blind box code status
 */
export async function toggleBlindBoxCodeStatus(codeId, newStatus) {
    await updateDoc(doc(db, 'blind_box_codes', codeId), {
        status: newStatus
    })
}

/**
 * Delete a blind box code
 */
export async function deleteBlindBoxCode(codeId) {
    await deleteDoc(doc(db, 'blind_box_codes', codeId))
}

/**
 * Redeem a blind box code
 * @returns {Promise<{amount: number, outcome_description: string}>}
 */
export async function redeemBlindBoxCode(code, teamId) {
    const normalizedCode = code.trim().toLowerCase()

    // Query for the code
    const q = query(
        collection(db, 'blind_box_codes'),
        where('code', '==', normalizedCode)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
        throw new Error('Code not found')
    }

    const codeDoc = snapshot.docs[0]
    const codeData = codeDoc.data()

    if (codeData.status === 'used') {
        throw new Error('Code already redeemed')
    }

    // Run transaction to update code and team
    const result = await runTransaction(db, async (transaction) => {
        // Update code status
        transaction.update(doc(db, 'blind_box_codes', codeDoc.id), {
            status: 'used',
            redeemed_by: teamId,
            redeemed_at: serverTimestamp()
        })

        // Update team followers
        transaction.update(doc(db, 'teams', teamId), {
            followers: increment(codeData.amount)
        })

        return {
            amount: codeData.amount,
            outcome_description: codeData.outcome_description
        }
    })

    return result
}
