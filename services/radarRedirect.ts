/**
 * Smart Radar Redirect – SkyPulse
 * Modular logic for opening external weather radar (default: Windy).
 * Platform-agnostic: build URL and read/write preference; UI opens WebView or external browser.
 */

const STORAGE_KEY_OPEN_EXTERNALLY = "skypulse_radar_open_externally";

/** Base URL for default radar provider (easy to replace later) */
export const RADAR_BASE_URL = "https://www.windy.com";

/** Global default when location unavailable (wide view) */
const DEFAULT_LAT = 40.71;
const DEFAULT_LON = -74.01;
const DEFAULT_ZOOM = 4;
const LOCATION_ZOOM = 8;

/**
 * Build radar URL with coordinates when available.
 * Windy format: ?lat,lon,zoom (lat/lon must include decimal).
 */
export function getRadarUrl(lat: number | null, lon: number | null): string {
  const hasCoords =
    typeof lat === "number" &&
    typeof lon === "number" &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  if (hasCoords) {
    const latStr = lat.toFixed(2);
    const lonStr = lon.toFixed(2);
    return `${RADAR_BASE_URL}/?${latStr},${lonStr},${LOCATION_ZOOM}`;
  }

  return `${RADAR_BASE_URL}/?${DEFAULT_LAT},${DEFAULT_LON},${DEFAULT_ZOOM}`;
}

/** User preference: open radar in external browser next time */
export function getRadarOpenExternally(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY_OPEN_EXTERNALLY);
    return v === "true";
  } catch {
    return false;
  }
}

export function setRadarOpenExternally(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_OPEN_EXTERNALLY, value ? "true" : "false");
  } catch {
    // ignore
  }
}
