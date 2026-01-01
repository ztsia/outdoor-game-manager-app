import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a Google Drive sharing URL to a direct image URL
 * Supports formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * @param {string} url - The Google Drive URL
 * @returns {string} - Direct image URL or original URL if not a Drive link
 */
export function getGoogleDriveDirectLink(url) {
  if (!url) return url;

  // Pattern 1: /file/d/FILE_ID/
  const filePattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const fileMatch = url.match(filePattern);
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }

  // Pattern 2: open?id=FILE_ID
  const openPattern = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const openMatch = url.match(openPattern);
  if (openMatch) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  }

  // Not a recognized Drive link, return as-is
  return url;
}

/**
 * Converts a hex color to RGB values
 * @param {string} hexColor - Hex color string (e.g., "#EF4444")
 * @returns {{r: number, g: number, b: number}} RGB values
 */
export function hexToRgb(hexColor) {
  if (!hexColor) return { r: 107, g: 114, b: 128 } // Default gray
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return { r, g, b }
}

/**
 * Check if a string is a flag emoji (Regional Indicator Symbol sequence)
 * Flag emojis are two Regional Indicator symbols (U+1F1E6 to U+1F1FF)
 * @param {string} emoji - The string to check
 * @returns {boolean} True if it's a flag emoji
 */
export function isFlagEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') return false
  // Flag emojis consist of two Regional Indicator Symbol Letter characters
  // These are in the range U+1F1E6 (🇦) to U+1F1FF (🇿)
  const codePoints = [...emoji].map(char => char.codePointAt(0))
  if (codePoints.length !== 2) return false
  return codePoints.every(cp => cp >= 0x1F1E6 && cp <= 0x1F1FF)
}

/**
 * Convert a flag emoji to its ISO 3166-1 alpha-2 country code
 * e.g., 🇫🇷 → "fr", 🇺🇸 → "us"
 * @param {string} emoji - Flag emoji
 * @returns {string|null} Lowercase country code or null if not a flag
 */
export function getCountryCodeFromFlag(emoji) {
  if (!isFlagEmoji(emoji)) return null
  const codePoints = [...emoji].map(char => char.codePointAt(0))
  // Convert Regional Indicator to ASCII letter (A=0x1F1E6, so subtract to get 0-25, then add 97 for 'a')
  const letters = codePoints.map(cp => String.fromCharCode(cp - 0x1F1E6 + 97))
  return letters.join('')
}

