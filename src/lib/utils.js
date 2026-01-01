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
