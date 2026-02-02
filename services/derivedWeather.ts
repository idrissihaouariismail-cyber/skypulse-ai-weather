/**
 * Single place for ALL derived weather values.
 * Only WeatherContext calls this; components never interpret raw data.
 * Uses unified condition logic (precip > 0.3 mm, clouds 30/70) so AI never contradicts icons.
 */

import { WeatherData, WeatherDerived, CurrentWeather } from "../types";
import { hasPrecipitation as hasPrecipFromSlot } from "./weatherCondition";

/** Precipitation probability 0–100 from normalized slot */
function getPop(current: CurrentWeather): number {
  const pop = (current as any)?.pop ?? (current as any)?.precipitation ?? (current as any)?.precipitationProbability ?? 0;
  if (typeof pop !== "number") return 0;
  return pop > 1 ? Math.round(pop) : Math.round(pop * 100);
}

/** True if slot has real precipitation (mm > 0.3). Same as unified icon rule. */
function hasRealPrecip(slot: CurrentWeather): boolean {
  return hasPrecipFromSlot(slot);
}

/** Rule-based: one fixed explanatory text key per AQI range. No AI; no wind/pressure. */
function getAqiRangeTextKey(aqi: number | null | undefined): string {
  if (aqi == null) return "aqi.range.unavailable";
  if (aqi <= 50) return "aqi.range.good.text";
  if (aqi <= 100) return "aqi.range.moderate.text";
  if (aqi <= 150) return "aqi.range.unhealthySensitive.text";
  if (aqi <= 200) return "aqi.range.unhealthy.text";
  return "aqi.range.veryUnhealthy.text"; // 201+
}

/**
 * AI Insight: how the weather may FEEL only. Not a weather authority; no AQI, no good/bad, no health advice.
 * 2–3 calm lines: comfort, humidity, temperature perception. Rain described as "possible" never "certain".
 */
function getInsightKeys(weather: WeatherData): WeatherDerived["insightKeys"] {
  const current = weather.current || {};
  const temp = Math.round(current.temperature ?? 0);
  const windSpeed = current.windSpeed ?? 0;
  const humidity = current.humidity ?? 0;
  const pop = getPop(current);
  const hasPrecip = hasRealPrecip(current);
  const conditionCode = (current as any)?.conditionCode ?? 800;
  const isStormy = conditionCode >= 200 && conditionCode < 300;
  const isFoggy = /fog|mist|haze/.test((current.condition ?? "").toLowerCase());

  const feelKeys: string[] = [];

  // 1) Temperature feel (one line)
  if (temp >= 32) feelKeys.push("aiInsight.feel.hot");
  else if (temp >= 26) feelKeys.push("aiInsight.feel.warm");
  else if (temp <= 2) feelKeys.push("aiInsight.feel.cold");
  else if (temp <= 10) feelKeys.push("aiInsight.feel.cool");
  else feelKeys.push("aiInsight.feel.mild");

  // 2) Humidity or wind (comfort)
  if (humidity > 78) feelKeys.push("aiInsight.feel.humid");
  else if (windSpeed >= 25) feelKeys.push("aiInsight.feel.windy");
  else if (windSpeed >= 12) feelKeys.push("aiInsight.feel.breeze");

  // 3) Rain possible / fog / storms (possible, not certain)
  if (isStormy) feelKeys.push("aiInsight.feel.stormPossible");
  else if (isFoggy) feelKeys.push("aiInsight.feel.fog");
  else if (hasPrecip || pop > 0) feelKeys.push("aiInsight.feel.rainPossible");

  return { feelKeys: feelKeys.slice(0, 3) };
}

/**
 * Radar insight from central state only. Observation tool; matches icons. No exaggeration.
 * Precipitation text only when precip > 0.3 mm (unified rule).
 */
function getRadarInsightKeysForLayer(weather: WeatherData | null, _layer: "clouds" | "wind"): string[] {
  if (!weather?.current) return ["radar.insight.now.loading"];
  const c = weather.current;
  const pressure = c.pressure ?? 1013;
  const windSpeed = c.windSpeed ?? 0;
  const clouds = (c as any)?.clouds ?? 0;
  const showPrecip = hasRealPrecip(c);
  const conditionCode = (c as any)?.conditionCode ?? 800;
  const highPressure = pressure > 1015;
  const lowPressure = pressure < 1005;
  const strongWind = windSpeed >= 8;
  const moderateWind = windSpeed >= 4 && windSpeed < 8;
  const weakWind = windSpeed < 4;
  const hasClouds = clouds > 30;

  const keys: string[] = [];

  if (highPressure && weakWind) keys.push("radar.insight.now.highPressureLightWinds");
  else if (lowPressure && (strongWind || moderateWind)) keys.push("radar.insight.now.lowPressureBreezy");
  else if (strongWind) keys.push("radar.insight.now.strongWindsChanges");
  else if (moderateWind) keys.push("radar.insight.now.moderateWindsClouds");

  if (hasClouds) keys.push("radar.insight.now.cloudsModerateTemp");
  if (showPrecip) {
    if (conditionCode >= 200 && conditionCode < 300) keys.push("radar.insight.now.precipHeavy");
    else keys.push("radar.insight.now.precipLight");
  } else keys.push("radar.insight.now.precipLow");

  if (keys.length === 0) return ["radar.insight.now.fallbackStable"];
  return keys;
}

/** Rule-based AQI category label key. Ranges: 0–50 Good, 51–100 Moderate, 101–150 Unhealthy for sensitive, 151–200 Unhealthy, 201+ Very Unhealthy. */
function getAqiCategoryKey(aqi: number | null | undefined): string {
  if (aqi == null) return "unknown";
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "unhealthyForSensitiveGroups";
  if (aqi <= 200) return "unhealthy";
  return "veryUnhealthy"; // 201+
}

/**
 * Compute all derived values from normalized weather. Single source of truth.
 * AQI: rule-based only (category + one text key per range). AI Insight: weather vars only.
 */
export function computeDerived(weather: WeatherData): WeatherDerived {
  const aqi = weather.airQuality?.aqi ?? null;

  const aqiCategoryKey = getAqiCategoryKey(aqi);
  const aqiRangeTextKey = getAqiRangeTextKey(aqi);
  const insightKeys = getInsightKeys(weather);

  return {
    aqiCategoryKey,
    aqiRangeTextKey,
    insightKeys,
  };
}

/** Get radar insight keys by layer (for RadarMap). */
export function getRadarInsightKeys(weather: WeatherData | null, layer: "clouds" | "wind"): string[] {
  return getRadarInsightKeysForLayer(weather, layer);
}
