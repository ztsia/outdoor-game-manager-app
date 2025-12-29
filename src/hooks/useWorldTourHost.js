import { doc, updateDoc, getDoc, Timestamp, arrayUnion, arrayRemove, increment } from 'firebase/firestore'
import { db } from '@/firebase'
import { toast } from 'sonner'

/**
 * useWorldTourHost - Hook for single-player World Tour game state management
 * Provides methods for start, score submission, timer/scoreboard controls, and abandoning
 */
export function useWorldTourHost(gameId) {
    // Guard: Return no-op functions if gameId is not provided
    if (!gameId) {
        return {
            startGame: async () => { },
            submitScore: async () => { },
            abandonGame: async () => { },
            incrementScore: async () => { },
            decrementScore: async () => { },
            setScore: async () => { },
            startTimer: async () => { },
            pauseTimer: async () => { },
            resetTimer: async () => { },
            setCountdownDuration: async () => { }
        }
    }

    const gameRef = doc(db, 'world_tour_games', gameId)

    /**
     * Start the game - marks current team as playing with difficulty
     * @param {string} teamId - The team starting the game
     * @param {string} difficulty - 'normal' | 'hard' | 'extreme'
     */
    const startGame = async (teamId, difficulty = 'normal') => {
        try {
            await updateDoc(gameRef, {
                current_team_id: teamId,
                'live_state.game_started': true,
                'live_state.difficulty': difficulty,
                'live_state.score': 0,
                'live_state.timer_started_at': null,
                'live_state.elapsed_seconds': 0,
                'live_state.is_paused': false
            })
            console.log('[useWorldTourHost] Game started by:', teamId, 'difficulty:', difficulty)
        } catch (err) {
            console.error('[useWorldTourHost] Failed to start game:', err)
            toast.error('Failed to start game')
        }
    }

    /**
     * Submit score and end the game
     * @param {number} finalScore - The final calculated score
     * @param {string} teamId - Team ID
     * @param {string} difficulty - Difficulty level played
     * @param {number} followersGained - Followers to add to team
     */
    const submitScore = async (finalScore, teamId, difficulty, followersGained = 0) => {
        try {
            // Get config for cooldown
            const configDoc = await getDoc(doc(db, 'system_config', 'game_rules'))
            const config = configDoc.exists() ? configDoc.data() : {}
            const cooldownMinutes = config.world_tour_cooldown_minutes || 5

            // Get current game data to check high score
            const gameDoc = await getDoc(gameRef)
            const gameData = gameDoc.exists() ? gameDoc.data() : {}
            const currentHighScore = gameData.high_score || 0
            const previousHolderId = gameData.high_score_holder_id

            const cooldownEnd = new Date(Date.now() + cooldownMinutes * 60 * 1000)

            const attempt = {
                team_id: teamId,
                score: finalScore,
                difficulty: difficulty,
                timestamp: Timestamp.now()
            }

            const updates = {
                current_team_id: null,
                cooldown_ends_at: Timestamp.fromDate(cooldownEnd),
                attempts: arrayUnion(attempt),
                // Reset live_state
                'live_state.game_started': false,
                'live_state.difficulty': null,
                'live_state.score': 0,
                'live_state.timer_started_at': null,
                'live_state.elapsed_seconds': 0,
                'live_state.is_paused': false
            }

            // Update high score if beaten
            const isNewHighScore = finalScore > currentHighScore
            if (isNewHighScore) {
                updates.high_score = finalScore
                updates.high_score_holder_id = teamId
            }

            await updateDoc(gameRef, updates)

            // Handle fan_favourites ownership transfer
            if (isNewHighScore && gameId) {
                // Remove from previous holder (if exists)
                if (previousHolderId && previousHolderId !== teamId) {
                    const previousTeamRef = doc(db, 'teams', previousHolderId)
                    await updateDoc(previousTeamRef, {
                        fan_favourites: arrayRemove(gameId)
                    })
                }

                // Add to current team
                const currentTeamRef = doc(db, 'teams', teamId)
                await updateDoc(currentTeamRef, {
                    fan_favourites: arrayUnion(gameId)
                })
            }

            // Add followers to team
            if (followersGained > 0 && teamId) {
                const teamRef = doc(db, 'teams', teamId)
                await updateDoc(teamRef, {
                    followers: increment(followersGained)
                })
            }

            console.log('[useWorldTourHost] Score submitted:', finalScore, 'Followers gained:', followersGained)
        } catch (err) {
            console.error('[useWorldTourHost] Failed to submit score:', err)
            toast.error('Failed to submit score')
        }
    }

    /**
     * Abandon game without saving score
     */
    const abandonGame = async () => {
        try {
            await updateDoc(gameRef, {
                current_team_id: null,
                'live_state.game_started': false,
                'live_state.difficulty': null,
                'live_state.score': 0,
                'live_state.timer_started_at': null,
                'live_state.elapsed_seconds': 0,
                'live_state.is_paused': false
            })
            console.log('[useWorldTourHost] Game abandoned')
        } catch (err) {
            console.error('[useWorldTourHost] Failed to abandon game:', err)
            toast.error('Failed to abandon game')
        }
    }

    /**
     * Increment score by 1
     */
    const incrementScore = async () => {
        try {
            await updateDoc(gameRef, {
                'live_state.score': increment(1)
            })
        } catch (err) {
            console.error('[useWorldTourHost] Failed to increment score:', err)
        }
    }

    /**
     * Decrement score by 1 (min 0)
     */
    const decrementScore = async () => {
        try {
            await updateDoc(gameRef, {
                'live_state.score': increment(-1)
            })
        } catch (err) {
            console.error('[useWorldTourHost] Failed to decrement score:', err)
        }
    }

    /**
     * Set score to a specific value
     * @param {number} newScore - The new score value
     */
    const setScore = async (newScore) => {
        try {
            const value = Math.max(0, Math.floor(newScore) || 0)
            await updateDoc(gameRef, {
                'live_state.score': value
            })
        } catch (err) {
            console.error('[useWorldTourHost] Failed to set score:', err)
        }
    }

    /**
     * Start shared timer
     */
    const startTimer = async () => {
        try {
            await updateDoc(gameRef, {
                'live_state.timer_started_at': Timestamp.now()
            })
        } catch (err) {
            console.error('[useWorldTourHost] Failed to start timer:', err)
        }
    }

    /**
     * Pause shared timer
     */
    const pauseTimer = async (elapsedSeconds) => {
        try {
            await updateDoc(gameRef, {
                'live_state.timer_started_at': null,
                'live_state.elapsed_seconds': elapsedSeconds
            })
        } catch (err) {
            console.error('[useWorldTourHost] Failed to pause timer:', err)
        }
    }

    /**
     * Reset shared timer
     */
    const resetTimer = async () => {
        try {
            await updateDoc(gameRef, {
                'live_state.timer_started_at': null,
                'live_state.elapsed_seconds': 0,
                'live_state.countdown_duration': 0
            })
        } catch (err) {
            console.error('[useWorldTourHost] Failed to reset timer:', err)
        }
    }

    /**
     * Set countdown duration
     * @param {number} seconds - Duration in seconds
     */
    const setCountdownDuration = async (seconds) => {
        try {
            await updateDoc(gameRef, {
                'live_state.countdown_duration': seconds
            })
            console.log(`[useWorldTourHost] Countdown duration set to ${seconds}s`)
        } catch (err) {
            console.error('[useWorldTourHost] Failed to set countdown duration:', err)
        }
    }

    return {
        startGame,
        submitScore,
        abandonGame,
        incrementScore,
        decrementScore,
        setScore,
        startTimer,
        pauseTimer,
        resetTimer,
        setCountdownDuration
    }
}

