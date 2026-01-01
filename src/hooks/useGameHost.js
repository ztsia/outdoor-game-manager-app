import { doc, updateDoc, getDoc, runTransaction, Timestamp, increment } from 'firebase/firestore'
import { db } from '@/firebase'
import { toast } from 'sonner'

/**
 * useGameHost - Hook for real-time game state management
 * Provides methods for score updates, timer controls, voting, and game resolution
 */
export function useGameHost(territoryId) {
    // Guard: Return no-op functions if territoryId is not provided
    if (!territoryId) {
        return {
            incrementScore: async () => { },
            decrementScore: async () => { },
            startGame: async () => { },
            startSharedTimer: async () => { },
            pauseSharedTimer: async () => { },
            resetSharedTimer: async () => { },
            setCountdownDuration: async () => { },
            requestEndGame: async () => { },
            submitVote: async () => { },
            setVoteMismatch: async () => { },
            resolveGame: async () => false
        }
    }

    const territoryRef = doc(db, 'territories', territoryId)

    /**
     * Increment score by 1
     */
    const incrementScore = async (role) => {
        try {
            const field = role === 'attacker' ? 'live_state.attacker_score' : 'live_state.defender_score'
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
                'live_state.timer_started_at': Timestamp.now()
            })
            console.log('[useGameHost] Shared timer started')
        } catch (err) {
            console.error('[useGameHost] Failed to start timer:', err)
            toast.error('Failed to start timer')
        }
    }

    /**
     * Pause shared timer
     * @param {number} currentElapsed - Current elapsed time in seconds
     */
    const pauseSharedTimer = async (currentElapsed) => {
        try {
            await updateDoc(territoryRef, {
                'live_state.shared_elapsed_seconds': currentElapsed,
                'live_state.timer_started_at': null
            })
            console.log(`[useGameHost] Shared timer paused at ${currentElapsed}s`)
        } catch (err) {
            console.error('[useGameHost] Failed to pause timer:', err)
            toast.error('Failed to pause timer')
        }
    }

    /**
     * Reset shared timer (also clears countdown duration)
     */
    const resetSharedTimer = async () => {
        try {
            await updateDoc(territoryRef, {
                'live_state.shared_elapsed_seconds': 0,
                'live_state.timer_started_at': null,
                'live_state.countdown_duration': 0
            })
            console.log('[useGameHost] Shared timer reset')
        } catch (err) {
            console.error('[useGameHost] Failed to reset timer:', err)
            toast.error('Failed to reset timer')
        }
    }

    /**
     * Set countdown duration
     * @param {number} seconds - Duration in seconds
     */
    const setCountdownDuration = async (seconds) => {
        try {
            await updateDoc(territoryRef, {
                'live_state.countdown_duration': seconds
            })
            console.log(`[useGameHost] Countdown duration set to ${seconds}s`)
        } catch (err) {
            console.error('[useGameHost] Failed to set countdown duration:', err)
            toast.error('Failed to set timer duration')
        }
    }

    // ==================== VOTING SYSTEM ====================

    /**
     * Request to end the game (opens modal for both players)
     */
    const requestEndGame = async (requesterId) => {
        try {
            await updateDoc(territoryRef, {
                'live_state.end_game_requested_at': Timestamp.now(),
                'live_state.end_game_requester_id': requesterId,
                'live_state.attacker_vote': null,
                'live_state.defender_vote': null,
                'live_state.vote_mismatch': false
            })
            console.log('[useGameHost] End game requested by:', requesterId)
        } catch (err) {
            console.error('[useGameHost] Failed to request end game:', err)
            toast.error('Failed to request end game')
        }
    }

    /**
     * Submit vote for winner
     * @param {'attacker' | 'defender'} voterRole - Who is voting
     * @param {'attacker' | 'defender'} selection - Who they think won
     */
    const submitVote = async (voterRole, selection) => {
        try {
            const voteField = voterRole === 'attacker'
                ? 'live_state.attacker_vote'
                : 'live_state.defender_vote'

            await updateDoc(territoryRef, {
                [voteField]: selection,
                'live_state.vote_mismatch': false // Reset mismatch on new vote
            })
            console.log(`[useGameHost] ${voterRole} voted for ${selection}`)
        } catch (err) {
            console.error('[useGameHost] Failed to submit vote:', err)
            toast.error('Failed to submit vote')
        }
    }

    /**
     * Set vote mismatch flag
     */
    const setVoteMismatch = async () => {
        try {
            await updateDoc(territoryRef, {
                'live_state.vote_mismatch': true,
                'live_state.attacker_vote': null,
                'live_state.defender_vote': null
            })
        } catch (err) {
            console.error('[useGameHost] Failed to set vote mismatch:', err)
        }
    }

    /**
     * Resolve game after consensus
     * @param {'attacker' | 'defender'} winner
     * @param {Object} territory - Current territory data for reference
     */
    const resolveGame = async (winner, territory) => {
        try {
            const attackerId = territory.current_attacker_id
            const defenderId = territory.owner_id
            const betAmount = territory.bet_amount || 0

            // Get system config for cooldown and max stars
            const configDoc = await getDoc(doc(db, 'system_config', 'game_rules'))
            const config = configDoc.exists() ? configDoc.data() : {}
            const cooldownMinutes = config.battle_cooldown_minutes || 15
            const maxStars = config.max_territory_stars || 3

            const resolved = await runTransaction(db, async (transaction) => {
                // Read territory document FIRST to check if already resolved
                const territoryDoc = await transaction.get(territoryRef)
                if (!territoryDoc.exists()) {
                    throw new Error('Territory not found')
                }

                const currentTerritoryData = territoryDoc.data()

                // Race condition guard: if already idle, another client resolved first
                if (currentTerritoryData.challenge_status !== 'accepted') {
                    console.log('[useGameHost] Already resolved by another client, skipping')
                    return false // Signal that we didn't resolve
                }

                // Read current team data
                const attackerRef = doc(db, 'teams', attackerId)
                const defenderRef = doc(db, 'teams', defenderId)
                const attackerDoc = await transaction.get(attackerRef)
                const defenderDoc = await transaction.get(defenderRef)

                if (!attackerDoc.exists() || !defenderDoc.exists()) {
                    throw new Error('Team data not found')
                }

                const attackerData = attackerDoc.data()
                const defenderData = defenderDoc.data()

                // Check if we can add stars
                const currentStars = currentTerritoryData.stars ?? 0
                const canAddStar = currentStars < maxStars

                if (winner === 'attacker') {
                    // Attacker wins: gets back bet, gains territory
                    transaction.update(attackerRef, {
                        followers: (attackerData.followers || 0) + betAmount,
                        territory_count: (attackerData.territory_count || 0) + 1
                    })
                    transaction.update(defenderRef, {
                        territory_count: Math.max(0, (defenderData.territory_count || 1) - 1)
                    })
                    // Update territory owner and optionally add star
                    const territoryUpdate = { owner_id: attackerId }
                    if (canAddStar) {
                        territoryUpdate.stars = increment(1)
                    }
                    transaction.update(territoryRef, territoryUpdate)
                } else {
                    // Defender wins: keeps territory, wins attacker's bet
                    transaction.update(defenderRef, {
                        followers: (defenderData.followers || 0) + betAmount
                    })
                    // Optionally add star
                    if (canAddStar) {
                        transaction.update(territoryRef, {
                            stars: increment(1)
                        })
                    }
                    // Attacker already lost bet when initiating
                }

                // Reset territory state
                const cooldownEnd = new Date(Date.now() + cooldownMinutes * 60 * 1000)
                transaction.update(territoryRef, {
                    challenge_status: 'idle',
                    under_attack: false,
                    current_attacker_id: null,
                    bet_amount: 0,
                    cooldown_ends_at: Timestamp.fromDate(cooldownEnd),
                    'live_state.game_started': false,
                    'live_state.attacker_score': 0,
                    'live_state.defender_score': 0,
                    'live_state.timer_started_at': null,
                    'live_state.shared_elapsed_seconds': 0,
                    'live_state.attacker_elapsed_seconds': 0,
                    'live_state.defender_elapsed_seconds': 0,
                    'live_state.attacker_timer_started_at': null,
                    'live_state.defender_timer_started_at': null,
                    'live_state.end_game_requested_at': null,
                    'live_state.end_game_requester_id': null,
                    'live_state.attacker_vote': null,
                    'live_state.defender_vote': null,
                    'live_state.vote_mismatch': false
                })

                return true // Signal successful resolution
            })

            if (resolved) {
                console.log('[useGameHost] Game resolved, winner:', winner)
            }
            return resolved
        } catch (err) {
            console.error('[useGameHost] Failed to resolve game:', err)
            toast.error('Failed to resolve game')
            return false
        }
    }

    return {
        // Score
        incrementScore,
        decrementScore,
        // Game lifecycle
        startGame,
        // Shared timer
        startSharedTimer,
        pauseSharedTimer,
        resetSharedTimer,
        setCountdownDuration,
        // Voting
        requestEndGame,
        submitVote,
        setVoteMismatch,
        resolveGame
    }
}
