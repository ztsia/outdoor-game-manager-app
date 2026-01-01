import { getCountryCodeFromFlag } from '@/lib/utils'

/**
 * FlagDisplay - Renders a flag emoji as an image for cross-platform support
 * Falls back to the original unicode if not a valid flag
 * 
 * @param {Object} props
 * @param {string} props.value - Unicode flag emoji (e.g., "🇫🇷")
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.size - Image width in pixels (default: 20)
 */
export function FlagDisplay({ value, className = '', size = 20 }) {
    if (!value) return null

    const countryCode = getCountryCodeFromFlag(value)

    if (countryCode) {
        return (
            <img
                src={`https://flagcdn.com/w40/${countryCode}.png`}
                alt={`${countryCode.toUpperCase()} flag`}
                className={`inline-block align-middle ${className}`}
                style={{ width: size, height: 'auto' }}
                loading="lazy"
            />
        )
    }

    // Fallback: render original unicode (for non-flag emojis)
    return <span className={className}>{value}</span>
}
