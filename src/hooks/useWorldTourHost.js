import { doc, updateDoc, getDoc, Timestamp, arrayUnion, increment } from 'firebase/firestore'
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
            startTimer: async () => { },
            pauseTimer: async () => { },
            resetTimer: async () => { }
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
     * @param {string} teamName - Team name for leaderboard display
     * @param {string} difficulty - Difficulty level played
     * @param {number} followersGained - Followers to add to team
     */
    const submitScore = async (finalScore, teamId, teamName, difficulty, followersGained = 0) => {
        try {
            // Get config for cooldown
            const configDoc = await getDoc(doc(db, 'system_config', 'game_rules'))
            const config = configDoc.exists() ? configDoc.data() : {}
            const cooldownMinutes = config.world_tour_cooldown_minutes || 5

            // Get current game data to check high score
            const gameDoc = await getDoc(gameRef)
            const gameData = gameDoc.exists() ? gameDoc.data() : {}
            const currentHighScore = gameData.high_score || 0

            const cooldownEnd = new Date(Date.now() + cooldownMinutes * 60 * 1000)

            const attempt = {
                team_id: teamId,
                team_name: teamName,
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
            if (finalScore > currentHighScore) {
                updates.high_score = finalScore
                updates.high_score_holder_id = teamId
            }

            await updateDoc(gameRef, updates)

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
                'live_state.elapsed_seconds': 0
            })
        } catch (err) {
            console.error('[useWorldTourHost] Failed to reset timer:', err)
        }
    }

    return {
        startGame,
        submitScore,
        abandonGame,
        incrementScore,
        decrementScore,
        startTimer,
        pauseTimer,
        resetTimer
    }
}

