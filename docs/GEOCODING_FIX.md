# Geocoding Fix - Production Solution

## Problem
App crashes with "Failed to fetch weather data" and "503 Service Unavailable" errors from Nominatim (OpenStreetMap).

## Solution
Replaced Nominatim with OpenWeather Geocoding API + in-memory caching + error handling.

---

## Changes Made

### 1. `services/weather.ts` - Geocoding Functions

**Removed:**
- All Nominatim API calls
- `nominatim.openstreetmap.org` URLs

**Added:**
- OpenWeather Geocoding API (`api.openweathermap.org/geo/1.0/direct`)
- In-memory cache (24-hour TTL)
- Error handling for API failures
- AbortSignal support for request cancellation

**Key Functions:**
```typescript
// Cached geocoding
getCoordinates(query: string, signal?: AbortSignal): Promise<Coordinates | null>

// City suggestions with caching
getCitySuggestions(query: string, signal?: AbortSignal): Promise<Coordinates[]>
```

### 2. `components/CitySearchAutocomplete.tsx`

**Removed:**
- `fetchCitySuggestionsNominatim()` function
- All Nominatim fallback logic

**Updated:**
- Uses `getCitySuggestions()` from `services/weather.ts`
- No fallback to Nominatim
- Proper error handling

### 3. `services/composeWeather.ts`

**Added:**
- Try-catch around geocoding
- Clear error messages
- Non-critical failures (forecast, air quality) don't crash app

### 4. `App.tsx`

**Updated:**
- Error handling preserves last valid weather data
- Soft error messages (no blank screen)
- User-friendly error messages

---

## Error Handling Strategy

### Geocoding Failures
```typescript
// Returns null on failure (no crash)
const coords = await getCoordinates(query);
if (!coords) {
  throw new Error("Location not found. Please check the city name.");
}
```

### Weather Fetch Failures
```typescript
// Keeps last valid data, shows error message
catch (err) {
  setError(errorMessage);
  // Don't clear weatherData - keep showing last valid data
}
```

### Non-Critical Failures
```typescript
// Forecast and Air Quality can fail silently
try {
  forecastRaw = await getSevenDayForecast(...);
} catch (error) {
  forecastRaw = []; // Use empty array, don't crash
}
```

---

## Cache Implementation

```typescript
// In-memory cache (24-hour TTL)
const GEOCODE_CACHE = new Map<string, CacheEntry>();

// Cache check before API call
const cached = getCachedCoordinates(query);
if (cached) return cached;

// Cache after successful API call
cacheCoordinates(query, coordinates);
```

**Benefits:**
- Reduces API calls
- Faster responses
- Lower rate limit risk
- Works offline for cached cities

---

## Example Usage

### Basic Geocoding
```typescript
import { getCoordinates } from "./services/weather";

const coords = await getCoordinates("Paris");
if (coords) {
  console.log(coords.lat, coords.lon);
}
```

### With Error Handling
```typescript
try {
  const coords = await getCoordinates("Paris");
  if (!coords) {
    throw new Error("Location not found");
  }
  // Use coords...
} catch (error) {
  console.error("Geocoding failed:", error);
  // Show user-friendly error
}
```

### City Suggestions
```typescript
import { getCitySuggestions } from "./services/weather";

const cities = await getCitySuggestions("New");
// Returns up to 8 city suggestions
```

---

## API Requirements

**OpenWeather Geocoding API:**
- Endpoint: `https://api.openweathermap.org/geo/1.0/direct`
- Requires: `VITE_OPENWEATHER_API_KEY` environment variable
- Free tier: 1,000 calls/day
- Rate limit: 60 calls/minute

**Error Codes:**
- `401`: Invalid API key
- `429`: Rate limit exceeded
- `503`: Service unavailable (rare)

---

## Testing Checklist

- [x] Geocoding works with OpenWeather API
- [x] Cache prevents duplicate API calls
- [x] Error handling prevents crashes
- [x] UI shows soft error messages
- [x] Last valid weather data preserved
- [x] No Nominatim calls remain
- [x] AbortSignal cancels requests
- [x] City suggestions work correctly

---

## Production Safety

✅ **No crashes**: All errors caught and handled  
✅ **Cache enabled**: Reduces API calls  
✅ **Error messages**: User-friendly feedback  
✅ **Data preservation**: Last valid data shown  
✅ **Request cancellation**: AbortSignal support  
✅ **No Nominatim**: Completely removed  

---

## Migration Notes

**Before:**
- Used Nominatim (unreliable, 503 errors)
- No caching
- App crashed on geocoding failures

**After:**
- Uses OpenWeather (reliable, same API key)
- In-memory cache (24h TTL)
- Graceful error handling
- App never crashes

---

## Configuration

Ensure `.env` file has:
```
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

Get API key from: https://openweathermap.org/api

