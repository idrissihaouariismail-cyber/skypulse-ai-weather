/**
 * Data normalization layer: map raw API responses to a single internal
 * "Weather Context" shape. No component may interpret raw API data.
 */

import type { NormalizedWeatherSlot, HourlyItem, ForecastItem } from "../types";

/** OpenWeather current weather response → normalized slot */
export function normalizeCurrentFromApi(raw: any): NormalizedWeatherSlot {
  const main = raw?.main ?? {};
  const wind = raw?.wind ?? {};
  const clouds = raw?.clouds ?? {};
  const weather = raw?.weather?.[0];
  const rain = raw?.rain ?? {};
  const dt = raw?.dt != null ? raw.dt * 1000 : Date.now();
  const sys = raw?.sys ?? {};

  const pop = raw?.pop != null ? (raw.pop > 1 ? raw.pop : raw.pop * 100) : 0;
  const rain1h = rain["1h"] ?? rain?.rain1h ?? undefined;
  const rain3h = rain["3h"] ?? rain?.rain3h ?? undefined;

  return {
    temperature: typeof main.temp === "number" ? main.temp : undefined,
    feelsLike: typeof main.feels_like === "number" ? main.feels_like : undefined,
    humidity: typeof main.humidity === "number" ? main.humidity : undefined,
    pressure: typeof main.pressure === "number" ? main.pressure : undefined,
    windSpeed: typeof wind.speed === "number" ? wind.speed : undefined,
    windDeg: typeof wind.deg === "number" ? wind.deg : undefined,
    clouds: typeof clouds.all === "number" ? clouds.all : undefined,
    pop: typeof pop === "number" ? Math.round(pop) : undefined,
    rain1h: typeof rain1h === "number" ? rain1h : undefined,
    rain3h: typeof rain3h === "number" ? rain3h : undefined,
    conditionCode: typeof weather?.id === "number" ? weather.id : undefined,
    condition: typeof weather?.description === "string" ? weather.description : undefined,
    timestamp: dt,
    sunrise: sys.sunrise != null ? sys.sunrise * 1000 : undefined,
    sunset: sys.sunset != null ? sys.sunset * 1000 : undefined,
  };
}

/** OpenWeather forecast list item → normalized slot */
export function normalizeForecastItemFromApi(item: any): NormalizedWeatherSlot {
  const main = item?.main ?? {};
  const wind = item?.wind ?? {};
  const clouds = item?.clouds ?? {};
  const weather = item?.weather?.[0];
  const rain = item?.rain ?? {};
  const dt = item?.dt != null ? item.dt * 1000 : 0;
  const pop = item?.pop != null ? (item.pop > 1 ? item.pop : item.pop * 100) : 0;
  const rain1h = rain["1h"] ?? undefined;
  const rain3h = rain["3h"] ?? rain?.rain3h ?? undefined;

  return {
    temperature: typeof main.temp === "number" ? main.temp : undefined,
    feelsLike: typeof main.feels_like === "number" ? main.feels_like : undefined,
    humidity: typeof main.humidity === "number" ? main.humidity : undefined,
    pressure: typeof main.pressure === "number" ? main.pressure : undefined,
    windSpeed: typeof wind.speed === "number" ? wind.speed : undefined,
    windDeg: typeof wind.deg === "number" ? wind.deg : undefined,
    clouds: typeof clouds.all === "number" ? clouds.all : undefined,
    pop: typeof pop === "number" ? Math.round(pop) : undefined,
    rain1h: typeof rain1h === "number" ? rain1h : undefined,
    rain3h: typeof rain3h === "number" ? rain3h : undefined,
    conditionCode: typeof weather?.id === "number" ? weather.id : undefined,
    condition: typeof weather?.description === "string" ? weather.description : undefined,
    timestamp: dt,
  };
}

/** Build hourly item with time string from normalized slot */
export function toHourlyItem(slot: NormalizedWeatherSlot, timeStr: string): HourlyItem {
  return {
    ...slot,
    time: timeStr,
    temp: slot.temperature ?? 0,
  };
}

/** Build daily forecast item with representative noon slot for icons */
export function toForecastItem(
  date: string,
  tempMin: number,
  tempMax: number,
  noonSlot: NormalizedWeatherSlot | null
): ForecastItem {
  return {
    date,
    min: tempMin,
    max: tempMax,
    condition: noonSlot?.condition,
    conditionCode: noonSlot?.conditionCode,
    slot: noonSlot ?? undefined,
  };
}
