/**
 * Rank Service - Calculate team ranks dynamically based on stats
 */

// Rank constants
export const RANKS = {
    NONE: null,        // Below Rookie threshold
    ROOKIE: 'Rookie',
    RISING_STAR: 'Rising Star',
    LEGEND: 'Legend'
}

/**
 * Default config if not loaded from DB
 */
const DEFAULT_CONFIG = {
    rank_thresholds: {
        rookie: { min_followers: 10000, min_stars: 0 },
        rising_star: { min_followers: 100000, min_stars: 3 },
        legend: { min_followers: 1000000, min_stars: 10, min_fan_favourites: 1 }
    },
    rank_weights: {
        followers: 1,
        star: 20000,
        fan_favourite: 100000
    }
}

/**
 * Calculate total score for a team based on weighted stats
 * Used for sorting/comparing teams within the same rank
 * @param {Object} team - Team object with followers
 * @param {Array} territories - Array of territory objects owned by team
 * @param {Object} config - Game rules config with rank_weights
 * @returns {number} Total score
 */
export function calculateTeamScore(team, territories = [], config = DEFAULT_CONFIG) {
    const weights = config.rank_weights || DEFAULT_CONFIG.rank_weights

    const followers = team.followers || 0
    const totalStars = territories.reduce((sum, t) => sum + (t.stars || 0), 0)
    const fanFavourites = (team.fan_favourites || []).length

    const score =
        (followers * weights.followers) +
        (totalStars * weights.star) +
        (fanFavourites * weights.fan_favourite)

    return score
}

/**
 * Determine rank for a team based on strict AND thresholds
 * - Rookie: >= min_followers AND >= min_stars
 * - Rising Star: >= min_followers AND >= min_stars
 * - Legend: >= min_followers AND >= min_stars AND >= min_fan_favourites
 * @param {Object} team - Team object
 * @param {Array} territories - Territories owned by team
 * @param {Object} config - Game rules config
 * @returns {string|null} Rank string or null if below rookie
 */
export function determineBaseRank(team, territories = [], config = DEFAULT_CONFIG) {
    const thresholds = config.rank_thresholds || DEFAULT_CONFIG.rank_thresholds

    const followers = team.followers || 0
    const totalStars = territories.reduce((sum, t) => sum + (t.stars || 0), 0)
    const fanFavourites = (team.fan_favourites || []).length

    // Check from highest to lowest (Legend -> Rising Star -> Rookie)
    const legend = thresholds.legend
    if (followers >= legend.min_followers &&
        totalStars >= legend.min_stars &&
        fanFavourites >= (legend.min_fan_favourites || 0)) {
        return RANKS.LEGEND
    }

    const risingStar = thresholds.rising_star
    if (followers >= risingStar.min_followers &&
        totalStars >= risingStar.min_stars) {
        return RANKS.RISING_STAR
    }

    const rookie = thresholds.rookie
    if (followers >= rookie.min_followers &&
        totalStars >= (rookie.min_stars || 0)) {
        return RANKS.ROOKIE
    }

    return RANKS.NONE
}

/**
 * Determine if a team is the Living Icon
 * Living Icon = Legend + Rank 1 among all teams
 * @param {Object} team - Current team
 * @param {Array} teamTerritories - Territories owned by current team
 * @param {Array} allTeams - All teams in the game
 * @param {Array} allTerritories - All territories in the game
 * @param {Object} config - Game rules config
 * @returns {boolean}
 */
export function isLivingIcon(team, teamTerritories, allTeams, allTerritories, config = DEFAULT_CONFIG) {
    // Must be a Legend first
    const rank = determineBaseRank(team, teamTerritories, config)
    if (rank !== RANKS.LEGEND) {
        return false
    }

    // Calculate scores for all legends
    const legendsWithScores = allTeams
        .map(t => {
            const tTerritories = allTerritories.filter(ter => ter.owner_id === t.id)
            const tRank = determineBaseRank(t, tTerritories, config)
            if (tRank !== RANKS.LEGEND) return null
            return {
                id: t.id,
                score: calculateTeamScore(t, tTerritories, config)
            }
        })
        .filter(Boolean)

    if (legendsWithScores.length === 0) return false

    // Sort by score descending
    legendsWithScores.sort((a, b) => b.score - a.score)

    // Current team is Living Icon if they have the highest score
    return legendsWithScores[0].id === team.id
}

/**
 * Get full rank info for a team
 * @param {Object} team - Team object
 * @param {Array} teamTerritories - Territories owned by team
 * @param {Array} allTeams - All teams (for Living Icon comparison)
 * @param {Array} allTerritories - All territories (for Living Icon comparison)
 * @param {Object} config - Game rules config
 * @returns {Object} { rank, isLivingIcon, score }
 */
export function getTeamRankInfo(team, teamTerritories, allTeams, allTerritories, config = DEFAULT_CONFIG) {
    const score = calculateTeamScore(team, teamTerritories, config)
    const rank = determineBaseRank(team, teamTerritories, config)
    const livingIcon = isLivingIcon(team, teamTerritories, allTeams, allTerritories, config)

    return {
        rank,
        isLivingIcon: livingIcon,
        score
    }
}
