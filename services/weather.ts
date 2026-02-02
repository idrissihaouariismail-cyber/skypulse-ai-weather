import { TemperatureUnit } from "../types";

export interface Coordinates {
  lat: number;
  lon: number;
  name?: string;
  country?: string;
}

// ============================================================================
// IN-MEMORY CACHE (Production-safe)
// ============================================================================

interface CacheEntry {
  coordinates: Coordinates;
  timestamp: number;
}

const GEOCODE_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached coordinates or null if expired/missing
 */
function getCachedCoordinates(query: string): Coordinates | null {
  const normalizedQuery = query.toLowerCase().trim();
  const entry = GEOCODE_CACHE.get(normalizedQuery);
  
  if (!entry) return null;
  
  const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
  if (isExpired) {
    GEOCODE_CACHE.delete(normalizedQuery);
    return null;
  }
  
  return entry.coordinates;
}

/**
 * Cache coordinates for a query
 */
function cacheCoordinates(query: string, coordinates: Coordinates): void {
  const normalizedQuery = query.toLowerCase().trim();
  GEOCODE_CACHE.set(normalizedQuery, {
    coordinates,
    timestamp: Date.now()
  });
}

// ============================================================================
// OPENWEATHER GEOCODING API
// ============================================================================

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const OPENWEATHER_GEO_URL = "https://api.openweathermap.org/geo/1.0";

/**
 * Geocode using OpenWeather API (production-safe)
 */
async function geocodeWithOpenWeather(query: string, signal?: AbortSignal): Promise<Coordinates | null> {
  if (!OPENWEATHER_API_KEY) {
    console.error("OpenWeather API key missing");
    return null;
  }

  const url = `${OPENWEATHER_GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=1&appid=${OPENWEATHER_API_KEY}`;

  try {
    const response = await fetch(url, {
      signal,
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("OpenWeather API key invalid");
        return null;
      }
      if (response.status === 429) {
        console.warn("OpenWeather rate limit exceeded");
        return null;
      }
      return null;
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const place = data[0];
    return {
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      country: place.country
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Request was cancelled, not an error
      return null;
    }
    console.error("Geocoding error:", error);
    return null;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get coordinates from city name or lat/lon string
 * Uses OpenWeather Geocoding API with caching
 */
export async function getCoordinates(query: string, signal?: AbortSignal): Promise<Coordinates | null> {
  if (!query || query.trim() === "") return null;

  // Check cache first
  const cached = getCachedCoordinates(query);
  if (cached) {
    return cached;
  }

  // Handle lat/lon format directly
  const latLonMatch = query.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (latLonMatch) {
    const coords: Coordinates = {
      lat: parseFloat(latLonMatch[1]),
      lon: parseFloat(latLonMatch[3]),
      name: query
    };
    cacheCoordinates(query, coords);
    return coords;
  }

  // Geocode with OpenWeather
  const coordinates = await geocodeWithOpenWeather(query, signal);
  
  if (coordinates) {
    cacheCoordinates(query, coordinates);
  }
  
  return coordinates;
}

/**
 * Reverse geocode: get city + country from latitude and longitude
 * Uses OpenWeather Geocoding API (reverse endpoint)
 */
export async function getCityFromCoordinates(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<Coordinates | null> {
  if (!OPENWEATHER_API_KEY) {
    console.error("OpenWeather API key missing");
    return null;
  }
  const url = `${OPENWEATHER_GEO_URL}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`;
  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      if (response.status === 401) console.error("OpenWeather API key invalid");
      if (response.status === 429) console.warn("OpenWeather rate limit exceeded");
      return null;
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const place = data[0];
    return {
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      country: place.country,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return null;
    console.error("Reverse geocoding error:", err);
    return null;
  }
}

/**
 * Get city suggestions for autocomplete
 * Uses OpenWeather Geocoding API with caching
 */
export async function getCitySuggestions(query: string, signal?: AbortSignal): Promise<Coordinates[]> {
  if (!query || query.trim().length < 2) return [];

  // Don't search for coordinates
  const latLonMatch = query.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (latLonMatch) return [];

  if (!OPENWEATHER_API_KEY) {
    console.error("OpenWeather API key missing");
    return [];
  }

  const url = `${OPENWEATHER_GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=8&appid=${OPENWEATHER_API_KEY}`;

  try {
    const response = await fetch(url, {
      signal,
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("OpenWeather API key invalid");
        return [];
      }
      if (response.status === 429) {
        console.warn("OpenWeather rate limit exceeded");
        return [];
      }
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Map results to Coordinates format
    const results: Coordinates[] = data.map((place: any) => ({
      lat: place.lat,
      lon: place.lon,
      name: place.name,
      country: place.country
    }));

    // Cache each result
    results.forEach((coords, index) => {
      if (coords.name) {
        cacheCoordinates(coords.name, coords);
      }
    });

    return results;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Request was cancelled, not an error
      return [];
    }
    console.error("City suggestions error:", error);
    return [];
  }
}

// ============================================================================
// WEATHER API
// ============================================================================

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

/**
 * Raw forecast list (3-hour steps) – single fetch for hourly + daily derivation
 */
export async function getForecastRaw(
  lat: number,
  lon: number,
  unit: TemperatureUnit | "celsius" | "fahrenheit"
): Promise<{ list: any[] }> {
  const unitsParam = unit === TemperatureUnit.CELSIUS ? "metric" : "imperial";
  const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${unitsParam}&appid=${OPENWEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Forecast error: " + response.status);
  const data = await response.json();
  return { list: data.list || [] };
}

/* ============================
   3) 7-DAY FORECAST (free = 5 days)
============================ */
export async function getSevenDayForecast(
  lat: number,
  lon: number,
  unit: TemperatureUnit | "celsius" | "fahrenheit"
): Promise<any[]> {
  const { list } = await getForecastRaw(lat, lon, unit);

  const byDay: Record<string, any[]> = {};

  list.forEach((item: any) => {
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
