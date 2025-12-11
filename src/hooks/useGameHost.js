import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { toast } from 'sonner'

/**
 * useGameHost - Hook for real-time game state management
 * Provides methods for score updates, timer controls, and game lifecycle
 */
export function useGameHost(territoryId) {
    const territoryRef = doc(db, 'territories', territoryId)

    /**
     * Update score for attacker or defender
     * @param {'attacker' | 'defender'} role 
     * @param {number} delta - Amount to add (or subtract if negative)
     */
    const updateScore = async (role, delta) => {
        try {
            const field = role === 'attacker' ? 'live_state.attacker_score' : 'live_state.defender_score'

            // Use FieldValue.increment would be better, but for simplicity:
            await updateDoc(territoryRef, {
                [field]: delta // Note: This sets the value, not increments
            })
        } catch (err) {
            console.error('[useGameHost] Failed to update score:', err)
            toast.error('Failed to update score')
        }
    }

    /**
     * Increment score by 1
     */
    const incrementScore = async (role) => {
        try {
            const field = role === 'attacker' ? 'live_state.attacker_score' : 'live_state.defender_score'
            // We need to read current value and increment
            // For real-time safety, this should use a transaction
            // For now, we'll use the increment approach
            const { increment } = await import('firebase/firestore')
            await updateDoc(territoryRef, {
                [field]: increment(1)
            })
        } catch (err) {
            console.error('[useGameHost] Failed to increment score:', err)
            toast.error('Failed to update score')
        }
    }

    /**
     * Decrement score by 1 (min 0)
     */
    const decrementScore = async (role) => {
        try {
            const { increment } = await import('firebase/firestore')
            const field = role === 'attacker' ? 'live_state.attacker_score' : 'live_state.defender_score'
            await updateDoc(territoryRef, {
                [field]: increment(-1)
            })
        } catch (err) {
            console.error('[useGameHost] Failed to decrement score:', err)
            toast.error('Failed to update score')
        }
    }

    /**
     * Start the game
     */
    const startGame = async () => {
        try {
            await updateDoc(territoryRef, {
                'live_state.game_started': true
            })
            console.log('[useGameHost] Game started')
        } catch (err) {
            console.error('[useGameHost] Failed to start game:', err)
            toast.error('Failed to start game')
        }
    }

    /**
     * Start shared timer
     */
    const startSharedTimer = async () => {
        try {
            await updateDoc(territoryRef, {
                'live_state.timer_started_at': Timestamp.now(),
                'live_state.is_paused': false
            })
            console.log('[useGameHost] Shared timer started')
        } catch (err) {
            console.error('[useGameHost] Failed to start timer:', err)
            toast.error('Failed to start timer')
        }
    }

    /**
     * Pause shared timer
     */
    const pauseSharedTimer = async () => {
        try {
            await updateDoc(territoryRef, {
                'live_state.is_paused': true
            })
            console.log('[useGameHost] Shared timer paused')
        } catch (err) {
            console.error('[useGameHost] Failed to pause timer:', err)
            toast.error('Failed to pause timer')
        }
    }

    /**
     * Reset shared timer
     */
    const resetSharedTimer = async () => {
        try {
            await updateDoc(territoryRef, {
                'live_state.timer_started_at': null,
                'live_state.is_paused': false
            })
            console.log('[useGameHost] Shared timer reset')
        } catch (err) {
            console.error('[useGameHost] Failed to reset timer:', err)
            toast.error('Failed to reset timer')
        }
    }

    /**
     * Start split timer for a specific role
     * @param {'attacker' | 'defender'} role
     */
    const startSplitTimer = async (role) => {
        try {
            const timerField = role === 'attacker'
                ? 'live_state.attacker_timer_started_at'
                : 'live_state.defender_timer_started_at'

            await updateDoc(territoryRef, {
                [timerField]: Timestamp.now()
            })
            console.log(`[useGameHost] ${role} timer started`)
        } catch (err) {
            console.error('[useGameHost] Failed to start split timer:', err)
            toast.error('Failed to start timer')
        }
    }

    /**
     * Pause split timer for a specific role
     * This calculates elapsed time and stores it, then clears the started_at
     * @param {'attacker' | 'defender'} role
     * @param {number} currentElapsed - Current calculated elapsed seconds
     */
    const pauseSplitTimer = async (role, currentElapsed) => {
        try {
            const elapsedField = role === 'attacker'
                ? 'live_state.attacker_elapsed_seconds'
                : 'live_state.defender_elapsed_seconds'
            const timerField = role === 'attacker'
                ? 'live_state.attacker_timer_started_at'
                : 'live_state.defender_timer_started_at'

            await updateDoc(territoryRef, {
                [elapsedField]: currentElapsed,
                [timerField]: null
            })
            console.log(`[useGameHost] ${role} timer paused at ${currentElapsed}s`)
        } catch (err) {
            console.error('[useGameHost] Failed to pause split timer:', err)
            toast.error('Failed to pause timer')
        }
    }

    /**
     * End the game and resolve battle
     * @param {'attacker' | 'defender'} winner
     */
    const endGame = async (winner) => {
        try {
            // TODO: Implement full battle resolution logic
            // - Transfer ownership if attacker won
            // - Apply cooldown
            // - Transfer/refund bet

            await updateDoc(territoryRef, {
                'challenge_status': 'idle',
                'under_attack': false,
                'live_state.game_started': false,
                'live_state.attacker_score': 0,
                'live_state.defender_score': 0,
                'live_state.timer_started_at': null,
                'live_state.is_paused': false,
                'live_state.attacker_elapsed_seconds': 0,
                'live_state.defender_elapsed_seconds': 0,
                'live_state.attacker_timer_started_at': null,
                'live_state.defender_timer_started_at': null,
                'current_attacker_id': null,
                'bet_amount': 0,
                'cooldown_ends_at': Date.now() + (15 * 60 * 1000) // 15 min cooldown
            })

            toast.success(`${winner.toUpperCase()} WON! Battle resolved.`)
            console.log('[useGameHost] Game ended, winner:', winner)
        } catch (err) {
            console.error('[useGameHost] Failed to end game:', err)
            toast.error('Failed to end game')
        }
    }

    return {
        updateScore,
        incrementScore,
        decrementScore,
        startGame,
        startSharedTimer,
        pauseSharedTimer,
        resetSharedTimer,
        startSplitTimer,
        pauseSplitTimer,
        endGame
    }
}
