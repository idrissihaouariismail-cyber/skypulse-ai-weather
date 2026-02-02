/**
 * Icon index mapping (STRICT - DO NOT CHANGE):
 * 0 = clear (sun)
 * 1 = night_clear (moon)
 * 2 = cloudy
 * 3 = partly_cloudy
 * 4 = rain_light
 * 5 = rain_sun
 * 6 = rain
 * 7 = thunder
 * 8 = thunder_rain
 * 9 = snow
 * 10 = snow_cloud
 * 11 = snow_rain
 *
 * GLOBAL RULES (unified condition): precipitation_mm > 0.3 → rain icon;
 * else clouds >= 70% → CLOUDY, >= 30% → PARTLY_CLOUDY, else CLEAR.
 */

import type { NormalizedWeatherSlot } from "../../types";
import { getUnifiedIconIndex } from "../../services/weatherCondition";

const iconFiles = [
  '0_sun.png',
  '1_moon.png',
  '2_cloudy.png',
  '3_partly_cloudy.png',
  '4_light_rain.png',
  '5_sun_rain.png',
  '6_rain.png',
  '7_thunder.png',
  '8_thunder_rain.png',
  '9_snow.png',
  '10_snow_cloud.png',
  '11_snow_rain.png'
];

/**
 * Single global icon resolver – delegates to unified condition logic.
 * Used for current, 48h, and 5-day; icons never contradict precipitation.
 * Pass timezoneOffsetSeconds for 48h so day/night uses local time vs API sunrise/sunset.
 */
export function resolveIconFromNormalizedSlot(
  slot: NormalizedWeatherSlot | undefined | null,
  sunriseSunset?: { sunrise: number; sunset: number },
  timezoneOffsetSeconds?: number
): number {
  return getUnifiedIconIndex(slot, sunriseSunset, timezoneOffsetSeconds);
}

/**
 * Map weather condition to icon index (fallback when no normalized slot).
 * @param weatherCode - Weather condition string or code
 * @param isNight - Whether it's night time
 * @returns Icon index (0-11), always valid
 */
export function mapWeatherToIconIndex(weatherCode: string | number, isNight: boolean): number {
  const lower = typeof weatherCode === 'string' ? weatherCode.toLowerCase() : String(weatherCode).toLowerCase();
  if (lower.includes("clear") || lower.includes("sunny") || lower.includes("sun")) return isNight ? 1 : 0;
  if (lower.includes("thunder") || lower.includes("storm")) {
    if (lower.includes("rain")) return 8;
    return 7;
  }
  if (lower.includes("sleet") || (lower.includes("snow") && lower.includes("rain"))) return 11;
  if (lower.includes("snow")) return (lower.includes("cloud") ? 10 : 9);
  if (lower.includes("drizzle")) return 4;
  if (lower.includes("partly") && (lower.includes("rain") || lower.includes("drizzle"))) return 5;
  if (lower.includes("rain")) return 6;
  if (lower.includes("partly") || lower.includes("partially")) return 3;
  if (lower.includes("cloud") || lower.includes("overcast") || lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return 2;
  return 2;
}

/**
 * Get icon index from condition string + hour (legacy; prefer resolveIconFromNormalizedSlot).
 */
export function getIconIndex(condition: string, hour: number, _temp: number): number {
  const validHour = typeof hour === 'number' && !isNaN(hour) ? hour : 12;
  const isNight = validHour >= 18 || validHour < 6;
  return mapWeatherToIconIndex(condition, isNight);
}

export function getIconPath(iconIndex: number): string {
  let validIndex = iconIndex;
  if (typeof validIndex !== 'number' || isNaN(validIndex) || validIndex < 0 || validIndex > 11) {
    validIndex = 0;
  }
  return `/weather-icons/${iconFiles[validIndex]}`;
}
