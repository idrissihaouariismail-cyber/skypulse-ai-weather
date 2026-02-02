/**
 * RainViewer API Service
 * Legal radar tile provider for weather visualization
 * Documentation: https://www.rainviewer.com/api.html
 */

export interface RainViewerTimestamp {
  time: number;
  path: string;
}

export interface RainViewerApiResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerTimestamp[];
    nowcast: RainViewerTimestamp[];
  };
}

const RAINVIEWER_API_URL = "https://api.rainviewer.com/public/weather-maps.json";

/**
 * Fetch available radar timestamps from RainViewer API
 */
export async function fetchRainViewerTimestamps(): Promise<RainViewerApiResponse> {
  try {
    const response = await fetch(RAINVIEWER_API_URL);
    if (!response.ok) {
      throw new Error(`RainViewer API error: ${response.status}`);
    }
    const data: RainViewerApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching RainViewer timestamps:", error);
    throw error;
  }
}

/**
 * Get radar tile URL for a specific timestamp
 * @param timestamp - Unix timestamp
 * @param z - Zoom level
 * @param x - Tile X coordinate
 * @param y - Tile Y coordinate
 * @param colorScheme - Color scheme (0-4, default: 1)
 * @param smooth - Smooth animation (0 or 1, default: 1)
 */
export function getRainViewerTileUrl(
  timestamp: number,
  z: number,
  x: number,
  y: number,
  colorScheme: number = 1,
  smooth: number = 1
): string {
  return `https://tilecache.rainviewer.com/v2/radar/${timestamp}/256/${z}/${x}/${y}/${colorScheme}/${smooth}.png`;
}

/**
 * Get all available timestamps (past + nowcast)
 */
export async function getAllRadarTimestamps(): Promise<number[]> {
  const data = await fetchRainViewerTimestamps();
  const past = data.radar.past.map((t) => t.time);
  const nowcast = data.radar.nowcast.map((t) => t.time);
  return [...past, ...nowcast];
}

/**
 * Get current radar timestamp (most recent)
 */
export async function getCurrentRadarTimestamp(): Promise<number | null> {
  try {
    const data = await fetchRainViewerTimestamps();
    const allTimestamps = [...data.radar.past, ...data.radar.nowcast];
    if (allTimestamps.length === 0) return null;

    const sorted = allTimestamps.sort((a, b) => b.time - a.time);
    return sorted[0].time;
  } catch (error) {
    console.error("Error getting current radar timestamp:", error);
    return null;
  }
}

const SIXTY_MINUTES_SEC = 60 * 60;
const FRAME_INTERVAL_SEC = 10 * 60; // 10 minutes

/**
 * Get radar frame timestamps for the last 60 minutes, one per ~10 minutes (max 6 frames).
 * Returns oldest first so animation runs past → now.
 */
export async function getLast60MinFrames(): Promise<number[]> {
  try {
    const data = await fetchRainViewerTimestamps();
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - SIXTY_MINUTES_SEC;
    const past = data.radar.past.filter((t) => t.time >= cutoff).map((t) => t.time);
    const nowcast = data.radar.nowcast.filter((t) => t.time >= cutoff).map((t) => t.time);
    const all = [...past, ...nowcast].filter((t) => t >= cutoff && t <= now);
    if (all.length === 0) return [];

    const uniq = [...new Set(all)].sort((a, b) => a - b);
    const frames: number[] = [];
    let last = -Infinity;
    for (const t of uniq) {
      if (t - last >= FRAME_INTERVAL_SEC || frames.length === 0) {
        frames.push(t);
        last = t;
      }
      if (frames.length >= 6) break;
    }
    return frames;
  } catch {
    return [];
  }
}

