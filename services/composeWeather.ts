import { TemperatureUnit, WeatherData, ForecastItem, HourlyItem, CurrentWeather } from "../types";
import { getWeather, getForecastRaw } from "./weather";
import { getAirQuality } from "./airquality";
import {
  normalizeCurrentFromApi,
  normalizeForecastItemFromApi,
  toHourlyItem,
  toForecastItem,
} from "./weatherNormalize";

/**
 * Validate latitude and longitude
 */
function validateCoordinates(lat: number, lon: number): void {
  if (typeof lat !== "number" || typeof lon !== "number") {
    throw new Error("Invalid coordinates: latitude and longitude must be numbers.");
  }
  if (isNaN(lat) || isNaN(lon)) {
    throw new Error("Invalid coordinates: latitude and longitude cannot be NaN.");
  }
  if (lat < -90 || lat > 90) {
    throw new Error("Invalid latitude: must be between -90 and 90.");
  }
  if (lon < -180 || lon > 180) {
    throw new Error("Invalid longitude: must be between -180 and 180.");
  }
}

/**
 * Get composed weather data from coordinates only
 * NEVER uses city names - coordinates only
 * 
 * @param lat - Latitude (-90 to 90)
 * @param lon - Longitude (-180 to 180)
 * @param unit - Temperature unit (Celsius or Fahrenheit)
 * @returns WeatherData object
 * @throws Error if coordinates are invalid or weather fetch fails
 */
export async function getComposedWeather(
  lat: number,
  lon: number,
  unit: TemperatureUnit
): Promise<WeatherData> {
  // Validate coordinates before fetching
  validateCoordinates(lat, lon);

  // 1) CURRENT WEATHER – normalize to single internal shape
  let currentData: any;
  try {
    currentData = await getWeather(lat, lon, unit);
  } catch (error) {
    console.error("Weather fetch error:", error);
    throw new Error("Failed to fetch weather data. Please try again later.");
  }

  let normalizedCurrent = normalizeCurrentFromApi(currentData);

  // 2) RAW FORECAST – build hourly (48h) and daily from same list, normalized
  let list: any[] = [];
  try {
    const raw = await getForecastRaw(lat, lon, unit);
    list = raw.list || [];
  } catch (error) {
    console.error("Forecast fetch error:", error);
  }

  // Current weather API has no pop; use first forecast slot if available
  if (normalizedCurrent.pop == null && list.length > 0 && list[0].pop != null) {
    const p = list[0].pop;
    normalizedCurrent = { ...normalizedCurrent, pop: p > 1 ? Math.round(p) : Math.round(p * 100) };
  }

  const sunriseMs = normalizedCurrent.sunrise;
  const sunsetMs = normalizedCurrent.sunset;

  const current: CurrentWeather = {
    ...normalizedCurrent,
    location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    sunriseFormatted: currentData.sys?.sunrise
      ? new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : undefined,
    sunsetFormatted: currentData.sys?.sunset
      ? new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : undefined,
    uvIndex: 0,
  };

  const timezoneOffsetSeconds = typeof currentData.timezone === "number" ? currentData.timezone : 0;
  const currentTimeUtcSeconds = typeof currentData.dt === "number" ? currentData.dt : Math.floor(Date.now() / 1000);
  const futureList = list.filter((item: any) => item.dt != null && item.dt > currentTimeUtcSeconds);
  const next48h = futureList.length > 0 ? futureList.slice(0, 16) : list.slice(0, 16);

  const hourly: HourlyItem[] = next48h.map((item: any, index: number) => {
    const slot = normalizeForecastItemFromApi(item);
    const dtUnix = item.dt;
    const withSun = index === 0 ? { ...slot, ...normalizedCurrent, temperature: normalizedCurrent.temperature, condition: normalizedCurrent.condition, conditionCode: normalizedCurrent.conditionCode, pop: normalizedCurrent.pop, clouds: normalizedCurrent.clouds, rain1h: normalizedCurrent.rain1h, rain3h: normalizedCurrent.rain3h } : { ...slot, sunrise: sunriseMs, sunset: sunsetMs };
    const base = toHourlyItem(withSun, "");
    base.dt = dtUnix;
    base.timestamp = dtUnix * 1000;
    return base;
  });
  if (hourly.length > 0) {
    hourly[0].temp = normalizedCurrent.temperature ?? hourly[0].temp;
    hourly[0].temperature = normalizedCurrent.temperature;
    hourly[0].condition = normalizedCurrent.condition;
    hourly[0].conditionCode = normalizedCurrent.conditionCode;
    hourly[0].pop = normalizedCurrent.pop;
    hourly[0].clouds = normalizedCurrent.clouds;
    hourly[0].rain1h = normalizedCurrent.rain1h;
    hourly[0].rain3h = normalizedCurrent.rain3h;
  }

  // 48-hour display: one card per hour (1h step). Conditions from 3h API slots; no faking.
  // Each slot gets timestamp = displayed hour (for day/night icons) and location sunrise/sunset.
  const hourly48: HourlyItem[] = [];
  for (let i = 0; i < 48; i++) {
    const hourDt = currentTimeUtcSeconds + (i + 1) * 3600;
    let slotIndex = next48h.reduce((best, item, idx) => (item.dt <= hourDt ? idx : best), -1);
    if (slotIndex < 0) slotIndex = 0;
    const slot = hourly[slotIndex];
    if (slot) {
      hourly48.push({
        ...slot,
        dt: hourDt,
        timestamp: hourDt * 1000,
        sunrise: sunriseMs ?? slot.sunrise,
        sunset: sunsetMs ?? slot.sunset,
        time: "",
        temp: slot.temp ?? slot.temperature ?? 0,
      });
    }
  }
  const hourlyFinal = hourly48.length > 0 ? hourly48 : hourly;

  const byDay: Record<string, any[]> = {};
  list.forEach((item: any) => {
    const day = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(item);
  });
  const forecast: ForecastItem[] = Object.keys(byDay).slice(0, 5).map((dayKey) => {
    const items = byDay[dayKey];
    const temps = items.map((i: any) => i.main?.temp ?? 0);
    const tempMin = temps.length ? Math.min(...temps) : 0;
    const tempMax = temps.length ? Math.max(...temps) : 0;
    const noonItem = items.find((i: any) => i.dt_txt?.includes("12:00:00")) || items[0];
    const noonSlot = noonItem ? normalizeForecastItemFromApi(noonItem) : null;
    if (noonSlot && sunriseMs != null && sunsetMs != null) {
      noonSlot.sunrise = sunriseMs;
      noonSlot.sunset = sunsetMs;
      noonSlot.timestamp = noonItem.dt * 1000;
    }
    return toForecastItem(dayKey, tempMin, tempMax, noonSlot);
  });
  const currentTemp = normalizedCurrent.temperature ?? 0;
  if (forecast.length > 0 && hourly.length > 0) {
    forecast[0].min = Math.min(forecast[0].min, currentTemp);
    forecast[0].max = Math.max(forecast[0].max, currentTemp);
  }

  // 3) AIR QUALITY – numeric data only; all text is rule-based from AQI ranges (i18n)
  let airQuality: WeatherData["airQuality"] = null;
  try {
    const aq = await getAirQuality(lat, lon);
    if (aq && aq.aqi != null) {
      airQuality = {
        aqi: aq.aqi,
        components: aq.components ?? {},
      };
    }
  } catch (err) {
    console.warn("Air quality fetch failed (non-critical):", err);
  }

  // Moon illumination from API when available (e.g. moon_illumination 0–100 or moon_phase 0–1)
  let moonIllumination: number | undefined;
  if (typeof currentData.moon_illumination === "number" && currentData.moon_illumination >= 0 && currentData.moon_illumination <= 100) {
    moonIllumination = Math.round(currentData.moon_illumination);
  } else if (typeof currentData.sys?.moon_phase === "number") {
    const phase = currentData.sys.moon_phase;
    if (phase >= 0 && phase <= 1) moonIllumination = Math.round(phase * 100);
  }

  return {
    current,
    forecast,
    hourly: hourlyFinal.length > 0 ? hourlyFinal : undefined,
    airQuality,
    timezoneOffsetSeconds,
    ...(moonIllumination != null && { moonIllumination }),
  };
}
