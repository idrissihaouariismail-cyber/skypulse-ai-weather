console.log("OW KEY =", import.meta.env.VITE_OPENWEATHER_API_KEY);
import { TemperatureUnit } from "../types";

export interface Coordinates {
  lat: number;
  lon: number;
  name?: string;
  country?: string;
}

/* ============================
   1) GET COORDINATES
============================ */
export async function getCoordinates(query: string): Promise<Coordinates | null> {
  if (!query || query.trim() === "") return null;

  const latLonMatch = query.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (latLonMatch) {
    return {
      lat: parseFloat(latLonMatch[1]),
      lon: parseFloat(latLonMatch[3]),
      name: query
    };
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}`;

  try {
    const response = await fetch(url, {
      headers: { "Accept-Language": "en" }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.length) return null;

    const place = data[0];

    return {
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
      name: place.display_name?.split(",")[0] ?? query,
      country: place.display_name?.split(",").pop()?.trim() ?? ""
    };
  } catch {
    return null;
  }
}

/* ============================
   2) WEATHER (VITE VERSION)
============================ */
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

if (!OPENWEATHER_API_KEY) {
  console.error("⛔ Missing OpenWeather API KEY!");
}

export async function getWeather(
  lat: number,
  lon: number,
  unit: TemperatureUnit
): Promise<any> {
  const unitsParam = unit === TemperatureUnit.CELSIUS ? "metric" : "imperial";

  const url = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${unitsParam}&appid=${OPENWEATHER_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather error: " + response.status);

  return response.json();
}

/* ============================
   3) 7-DAY FORECAST (free = 5 days)
============================ */
export async function getSevenDayForecast(
  lat: number,
  lon: number,
  unit: TemperatureUnit | "celsius" | "fahrenheit"
): Promise<any[]> {
  const unitsParam = unit === TemperatureUnit.CELSIUS ? "metric" : "imperial";

  const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${unitsParam}&appid=${OPENWEATHER_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Forecast error: " + response.status);
  const data = await response.json();

  const byDay: Record<string, any[]> = {};

  data.list.forEach((item: any) => {
    const day = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(item);
  });

  return Object.keys(byDay)
    .slice(0, 5)
    .map((dayKey) => {
      const items = byDay[dayKey];

      const temps = items.map((i: any) => i.main.temp);
      const tempMin = Math.min(...temps);
      const tempMax = Math.max(...temps);

      const iconItem =
        items.find((i: any) => i.dt_txt.includes("12:00:00")) || items[0];

      return {
        date: dayKey,
        tempMin,
        tempMax,
        icon: iconItem.weather[0].icon,
        description: iconItem.weather[0].description,
      };
    });
}