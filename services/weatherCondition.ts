/**
 * UNIFIED WEATHER CONDITION LOGIC
 * Single global function used everywhere: current, 48h, 5-day, AI Insight.
 * Icons must NEVER contradict real precipitation values.
 *
 * Rules:
 * - precipitation_mm > 0.3 → RAIN (or THUNDER/SNOW by conditionCode)
 * - else clouds >= 70% → CLOUDY
 * - else clouds >= 30% → PARTLY_CLOUDY
 * - else → CLEAR
 */

import type { NormalizedWeatherSlot } from "../types";
import type { UnifiedCondition } from "../types";

const PRECIP_MM_THRESHOLD = 0.3;
const CLOUDS_CLOUDY = 70;
const CLOUDS_PARTLY = 30;

const SECONDS_PER_DAY = 86400;

/**
 * Day/night using ONLY API sunrise/sunset and timezone_offset.
 * Converts hourly dt, sunrise, sunset to local time-of-day; never guess when data missing.
 * isNight = (hourLocal < sunriseLocal) OR (hourLocal >= sunsetLocal).
 */
function isNightFromSun(
  timestampMs: number,
  sunriseMs?: number,
  sunsetMs?: number,
  timezoneOffsetSeconds?: number
): boolean {
  if (sunriseMs == null || sunsetMs == null) {
    const d = new Date(timestampMs);
    const hour = d.getHours();
    return hour >= 18 || hour < 6;
  }
  if (typeof timezoneOffsetSeconds !== "number") {
    const d = new Date(timestampMs);
    const hour = d.getHours();
    return hour >= 18 || hour < 6;
  }
  const tsSec = Math.floor(timestampMs / 1000);
  const sunriseSec = Math.floor(sunriseMs / 1000);
  const sunsetSec = Math.floor(sunsetMs / 1000);
  const hourLocal = ((tsSec + timezoneOffsetSeconds) % SECONDS_PER_DAY + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  const sunriseLocal = ((sunriseSec + timezoneOffsetSeconds) % SECONDS_PER_DAY + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  const sunsetLocal = ((sunsetSec + timezoneOffsetSeconds) % SECONDS_PER_DAY + SECONDS_PER_DAY) % SECONDS_PER_DAY;
  return hourLocal < sunriseLocal || hourLocal >= sunsetLocal;
}

/**
 * Precipitation in mm from slot. Used for condition only (no invented rain).
 */
export function getPrecipitationMm(slot: NormalizedWeatherSlot | undefined | null): number {
  if (!slot) return 0;
  const r1 = slot.rain1h ?? 0;
  const r3 = slot.rain3h ?? 0;
  return Math.max(r1, r3);
}

/**
 * True if slot has real precipitation (mm > 0.3). Matches icon rule.
 */
export function hasPrecipitation(slot: NormalizedWeatherSlot | undefined | null): boolean {
  return getPrecipitationMm(slot) > PRECIP_MM_THRESHOLD;
}

/**
 * ONE global function: condition + icon index from normalized slot only.
 * Reused for: current weather, hourly (48h), 5-day, AI Insight.
 * For 48h pass timezoneOffsetSeconds so day/night uses local time vs API sunrise/sunset.
 */
export function getUnifiedCondition(
  slot: NormalizedWeatherSlot | undefined | null,
  sunriseSunset?: { sunrise: number; sunset: number },
  timezoneOffsetSeconds?: number
): { condition: UnifiedCondition; iconIndex: number } {
  if (!slot) {
    return { condition: "CLEAR", iconIndex: 0 };
  }

  const precipMm = getPrecipitationMm(slot);
  const clouds = slot.clouds ?? 0;
  const code = slot.conditionCode ?? 800;
  const ts = slot.timestamp ?? Date.now();
  const sunrise = slot.sunrise ?? sunriseSunset?.sunrise;
  const sunset = slot.sunset ?? sunriseSunset?.sunset;
  const isNight = isNightFromSun(ts, sunrise, sunset, timezoneOffsetSeconds);

  if (precipMm > PRECIP_MM_THRESHOLD) {
    if (code >= 200 && code < 300) {
      return { condition: "THUNDER", iconIndex: 8 };
    }
    if (code >= 600 && code < 700) {
      if (code >= 615 && code <= 616) return { condition: "SNOW_RAIN", iconIndex: 11 };
      return { condition: "SNOW", iconIndex: clouds >= 70 ? 10 : 9 };
    }
    if (code >= 300 && code < 400) {
      return { condition: "RAIN", iconIndex: 4 };
    }
    return {
      condition: "RAIN",
      iconIndex: !isNight && clouds >= 30 && clouds <= 70 ? 5 : 6,
    };
  }

  if (clouds >= CLOUDS_CLOUDY) return { condition: "CLOUDY", iconIndex: 2 };
  if (clouds >= CLOUDS_PARTLY) return { condition: "PARTLY_CLOUDY", iconIndex: 3 };
  return { condition: "CLEAR", iconIndex: isNight ? 1 : 0 };
}

/**
 * Whether the slot time is night (before sunrise or after sunset).
 * Uses API sunrise/sunset and optional timezone; for Moon card etc.
 */
export function isNightForSlot(
  slot: NormalizedWeatherSlot | undefined | null,
  sunriseSunset?: { sunrise: number; sunset: number },
  timezoneOffsetSeconds?: number
): boolean {
  if (!slot) return false;
  const ts = slot.timestamp ?? Date.now();
  const sunrise = slot.sunrise ?? sunriseSunset?.sunrise;
  const sunset = slot.sunset ?? sunriseSunset?.sunset;
  return isNightFromSun(ts, sunrise, sunset, timezoneOffsetSeconds);
}

/**
 * Icon index only (for components that only need the icon).
 * Pass timezoneOffsetSeconds for 48h so day/night uses local time vs API sunrise/sunset.
 */
export function getUnifiedIconIndex(
  slot: NormalizedWeatherSlot | undefined | null,
  sunriseSunset?: { sunrise: number; sunset: number },
  timezoneOffsetSeconds?: number
): number {
  return getUnifiedCondition(slot, sunriseSunset, timezoneOffsetSeconds).iconIndex;
}

/** Background image key from same condition source (current, 48h, 5-day). */
const CONDITION_TO_BG: Record<UnifiedCondition, string> = {
  CLEAR: "clear",
  PARTLY_CLOUDY: "partly_cloudy",
  CLOUDY: "overcast",
  RAIN: "rain",
  THUNDER: "thunderstorm",
  SNOW: "snow",
  SNOW_RAIN: "rain",
};

export function getBackgroundKeyFromCondition(
  slot: NormalizedWeatherSlot | undefined | null,
  sunriseSunset?: { sunrise: number; sunset: number },
  timezoneOffsetSeconds?: number
): string {
  const { condition } = getUnifiedCondition(slot, sunriseSunset, timezoneOffsetSeconds);
  return CONDITION_TO_BG[condition] ?? "clear";
}
