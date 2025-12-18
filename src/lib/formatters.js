/**
 * Format a number with K/M suffix for display
 * @param {number} num - The number to format
 * @returns {string} Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
}
