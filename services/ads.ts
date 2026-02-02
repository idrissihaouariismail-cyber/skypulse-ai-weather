/**
 * Interstitial ad gate for premium features (e.g. Radar).
 * - Only interstitial; no ads on app launch or Dashboard.
 * - Frequency limit: once every 15 minutes (stored in localStorage).
 * - Replace showRadarInterstitial() body with real AdMob when integrating.
 */

const STORAGE_KEY_LAST_INTERSTITIAL = "skypulse_last_interstitial_ms";
const RADAR_INTERSTITIAL_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export function getLastInterstitialTime(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_INTERSTITIAL);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function setLastInterstitialTime(ms: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_INTERSTITIAL, String(ms));
  } catch {
    // ignore
  }
}

/** True if enough time has passed since the last Radar interstitial. */
export function canShowRadarInterstitial(): boolean {
  const last = getLastInterstitialTime();
  return Date.now() - last >= RADAR_INTERSTITIAL_COOLDOWN_MS;
}

/**
 * Show interstitial ad before Radar. Resolves when ad is closed (or skipped/failed).
 * - Do NOT call on app launch or Dashboard.
 * - Call only when user explicitly opens Radar (after gate loading).
 * Replace the implementation with AdMob/Capacitor when integrating.
 */
export function showRadarInterstitial(): Promise<void> {
  return new Promise((resolve) => {
    setLastInterstitialTime(Date.now());

    // Stub: simulate ad display (e.g. 2s). Replace with:
    // AdMob.prepareInterstitial(); AdMob.showInterstitial(); then resolve in onAdDismissed.
    const stubDurationMs = 2000;
    setTimeout(() => resolve(), stubDurationMs);
  });
}
