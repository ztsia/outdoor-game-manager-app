import { doc, updateDoc, getDoc, Timestamp, arrayUnion } from 'firebase/firestore'
import { db } from '@/firebase'
import { toast } from 'sonner'

/**
 * useWorldTourHost - Hook for single-player World Tour game state management
 * Provides methods for start, score submission, and abandoning
 */
export function useWorldTourHost(gameId) {
    // Guard: Return no-op functions if gameId is not provided
    if (!gameId) {
        return {
            startGame: async () => { },
            submitScore: async () => { },
            abandonGame: async () => { }
        }
    }

    const gameRef = doc(db, 'world_tour_games', gameId)

    /**
     * Start the game - marks current team as playing
     * @param {string} teamId - The team starting the game
     */
    const startGame = async (teamId) => {
        try {
            await updateDoc(gameRef, {
                current_team_id: teamId,
                started_at: Timestamp.now()
            })
            console.log('[useWorldTourHost] Game started by:', teamId)
        } catch (err) {
            console.error('[useWorldTourHost] Failed to start game:', err)
            toast.error('Failed to start game')
        }
    }

    /**
     * Submit score and end the game
     * @param {number} score - The score achieved
     * @param {string} teamId - Team ID
     * @param {string} teamName - Team name for leaderboard display
     */
    const submitScore = async (score, teamId, teamName) => {
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
                score: score,
                timestamp: Timestamp.now()
            }

            const updates = {
                current_team_id: null,
                started_at: null,
                cooldown_ends_at: Timestamp.fromDate(cooldownEnd),
                attempts: arrayUnion(attempt)
            }

            // Update high score if beaten
            if (score > currentHighScore) {
                updates.high_score = score
                updates.high_score_holder_id = teamId
                toast.success('🏆 New High Score!')
            }

            await updateDoc(gameRef, updates)
            console.log('[useWorldTourHost] Score submitted:', score)
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
                started_at: null
            })
            console.log('[useWorldTourHost] Game abandoned')
        } catch (err) {
            console.error('[useWorldTourHost] Failed to abandon game:', err)
            toast.error('Failed to abandon game')
        }
    }

    return {
        startGame,
        submitScore,
        abandonGame
    }
}
