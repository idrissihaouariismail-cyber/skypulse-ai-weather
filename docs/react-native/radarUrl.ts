/**
 * Windy radar URL builder for SkyPulse React Native.
 * Use when location is unavailable → default radar view.
 */

const WINDY_BASE = "https://www.windy.com";
const DEFAULT_LAT = 40.71;
const DEFAULT_LON = -74.01;

/**
 * Build Windy radar URL: ?radar,{lat},{lon}
 * If coords invalid, returns default global view.
 */
export function getWindyRadarUrl(lat: number | null, lon: number | null): string {
  const valid =
    typeof lat === "number" &&
    typeof lon === "number" &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  if (valid) {
    return `${WINDY_BASE}/?radar,${lat},${lon}`;
  }
  return `${WINDY_BASE}/?radar,${DEFAULT_LAT},${DEFAULT_LON}`;
}
