import { Home, Swords, Clock, Shield } from 'lucide-react'

/**
 * Calculate the status of a territory for display purposes
 * @param {object} territory - The territory object
 * @param {string} myTeamId - The current user's team ID
 * @param {Set} defendingTeams - Set of team IDs currently defending
 * @param {number} now - Current timestamp in ms
 * @param {number} challengeTimeout - Timeout duration in seconds
 * @returns {object} Status object { disabled, reason, badge }
 */
export function getTerritoryStatus(territory, myTeamId, defendingTeams, now, challengeTimeout) {
    // Own territory - can't attack yourself
    if (territory.owner_id === myTeamId) {
        return {
            disabled: true,
            reason: 'owned',
            badge: { icon: Home, text: 'YOUR TERRITORY', variant: 'secondary' }
        }
    }

    // Currently under challenge or attack
    if (territory.challenge_status !== 'idle') {
        let statusText = territory.challenge_status === 'requesting' ? 'AWAITING RESPONSE' : 'BATTLE IN PROGRESS'

        // Add countdown for requesting status
        if (territory.challenge_status === 'requesting' && territory.challenged_at) {
            const challengedAt = territory.challenged_at.toDate?.() || new Date(territory.challenged_at)
            const expiresAt = new Date(challengedAt.getTime() + challengeTimeout * 1000)
            const remainingMs = expiresAt - now

            if (remainingMs > 0) {
                const remainingSecs = Math.ceil(remainingMs / 1000)
                const mins = Math.floor(remainingSecs / 60)
                const secs = remainingSecs % 60
                statusText = `AWAITING (${mins}:${secs.toString().padStart(2, '0')})`
            } else {
                statusText = 'TIMED OUT'
            }
        }

        return {
            disabled: true,
            reason: 'battle',
            badge: { icon: Swords, text: statusText, variant: 'destructive' }
        }
    }

    // On cooldown
    if (territory.cooldown_ends_at) {
        const cooldownEnd = territory.cooldown_ends_at.toDate?.() || territory.cooldown_ends_at
        const cooldownEndMs = typeof cooldownEnd === 'number' ? cooldownEnd : cooldownEnd.getTime()

        if (cooldownEndMs > now) {
            const remainingMs = cooldownEndMs - now
            const remainingSecs = Math.ceil(remainingMs / 1000)
            const mins = Math.floor(remainingSecs / 60)
            const secs = remainingSecs % 60
            return {
                disabled: true,
                reason: 'cooldown',
                badge: { icon: Clock, text: `COOLDOWN (${mins}:${secs.toString().padStart(2, '0')})`, variant: 'outline' }
            }
        }
    }

    // Team defense lock - owner is defending elsewhere
    if (defendingTeams.has(territory.owner_id)) {
        return {
            disabled: true,
            reason: 'defense_lock',
            badge: { icon: Shield, text: 'DEFENDING ELSEWHERE', variant: 'outline' }
        }
    }

    // Available for attack
    return { disabled: false, reason: null, badge: null }
}

/**
 * Calculate the status of a World Tour game for display purposes
 * @param {object} game - The world tour game object
 * @param {number} now - Current timestamp in ms
 * @returns {object} Status object { disabled, reason, badge }
 */
export function getWorldTourStatus(game, now) {
    // Currently being played by a team
    if (game.current_team_id) {
        return {
            disabled: true,
            reason: 'in_progress',
            badge: { icon: Swords, text: 'IN PROGRESS', variant: 'destructive' }
        }
    }

    // On cooldown
    if (game.cooldown_ends_at) {
        const cooldownEnd = game.cooldown_ends_at.toDate?.() || game.cooldown_ends_at
        const cooldownEndMs = typeof cooldownEnd === 'number' ? cooldownEnd : cooldownEnd.getTime()

        if (cooldownEndMs > now) {
            const remainingMs = cooldownEndMs - now
            const remainingSecs = Math.ceil(remainingMs / 1000)
            const mins = Math.floor(remainingSecs / 60)
            const secs = remainingSecs % 60
            return {
                disabled: true,
                reason: 'cooldown',
                badge: { icon: Clock, text: `COOLDOWN (${mins}:${secs.toString().padStart(2, '0')})`, variant: 'outline' }
            }
        }
    }

    // Available to play
    return { disabled: false, reason: null, badge: null }
}
