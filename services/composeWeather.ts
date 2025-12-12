import { TemperatureUnit, WeatherData, ForecastItem } from "../types";
import { getCoordinates, getWeather, getSevenDayForecast } from "./weather";
import { getAirQuality } from "./airquality";

function mapConditionToIcon(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("thunder")) return "Thunderstorm";
  if (d.includes("snow")) return "Snowy";
  if (d.includes("rain") || d.includes("drizzle")) return "Rainy";
  if (d.includes("cloud")) return "Cloudy";
  if (d.includes("clear")) return "Sunny";
  return "Windy";
}

export async function getComposedWeather(
  locationQuery: string | { lat: number; lon: number },
  unit: TemperatureUnit
): Promise<WeatherData> {

  console.log("DEBUG → getComposedWeather() LOCATION =", locationQuery);

  // 1) GET COORDS
  let coords: { lat: number; lon: number; name?: string; country?: string } | null;
  
  // If locationQuery is coordinates object, use directly
  if (typeof locationQuery === "object" && "lat" in locationQuery && "lon" in locationQuery) {
    coords = {
      lat: locationQuery.lat,
      lon: locationQuery.lon,
      name: `${locationQuery.lat.toFixed(4)},${locationQuery.lon.toFixed(4)}`
    };
  } else {
    // Otherwise, treat as string and geocode it
    coords = await getCoordinates(locationQuery);
  }
  
  console.log("DEBUG → COORDS =", coords);

  if (!coords) throw new Error("Location not found");

  // 2) CURRENT WEATHER
  const currentData = await getWeather(coords.lat, coords.lon, unit);
  console.log("DEBUG → CURRENT WEATHER =", currentData);

  // 3) FORECAST (5 days)
  const forecastRaw = await getSevenDayForecast(coords.lat, coords.lon, unit);
  console.log("DEBUG → FORECAST RAW =", forecastRaw);

  const forecast: ForecastItem[] = forecastRaw.map((d: any) => ({
    date: d.date,
    min: d.tempMin ?? d.temp_min ?? 0,
    max: d.tempMax ?? d.temp_max ?? 0,
    condition: d.description || d.condition || "clear",
  }));

  console.log("DEBUG → FORECAST FINAL =", forecast);

  // 4) AIR QUALITY
  let airQuality: any = null;
  try {
    const aq = await getAirQuality(coords.lat, coords.lon);
    console.log("DEBUG → AIR QUALITY =", aq);

    // Map AQI number to level
    const getAqiLevel = (aqi: number): string => {
      if (aqi <= 50) return "Good";
      if (aqi <= 100) return "Moderate";
      if (aqi <= 150) return "Unhealthy for Sensitive Groups";
      if (aqi <= 200) return "Unhealthy";
      if (aqi <= 300) return "Very Unhealthy";
      return "Hazardous";
    };

    const getAqiRecommendation = (aqi: number): string => {
      if (aqi <= 50) return "Air quality is satisfactory.";
      if (aqi <= 100) return "Acceptable; unusually sensitive people should consider limiting outdoor exertion.";
      if (aqi <= 150) return "Sensitive groups should reduce prolonged or heavy exertion outdoors.";
      if (aqi <= 200) return "Everyone should limit prolonged or heavy exertion outdoors.";
      if (aqi <= 300) return "Avoid strenuous outdoor activities; consider wearing a mask.";
      return "Stay indoors and keep activity levels low.";
    };

    if (aq && aq.aqi !== null) {
      airQuality = {
        aqi: aq.aqi,
        pollutant: "PM2.5",
        concentration: aq.components?.pm2_5 ?? aq.components?.pm25 ?? 0,
        level: getAqiLevel(aq.aqi),
        recommendation: getAqiRecommendation(aq.aqi),
        components: aq.components || {}
      };
    }

  } catch (err) {
    console.warn("Air quality fetch failed:", err);
  }

  // 5) FINAL RETURN OBJECT
  return {
    current: {
      location:
        coords.name && coords.country
          ? `${coords.name}, ${coords.country}`
          : coords.name
            ? coords.name
            : `${coords.lat},${coords.lon}`,

      temperature: currentData.main && typeof currentData.main.temp === "number" ? currentData.main.temp : 0,
      condition: currentData.weather && currentData.weather[0] && typeof currentData.weather[0].description === "string"
        ? currentData.weather[0].description
        : "Unknown",
      humidity: currentData.main && typeof currentData.main.humidity === "number" ? currentData.main.humidity : 0,
      windSpeed: currentData.wind && typeof currentData.wind.speed === "number" ? currentData.wind.speed : 0,
      pressure: currentData.main?.pressure ?? 0,
      uvIndex: 0,

      // ✔ NEW: sunrise/sunset
      sunrise: currentData.sys?.sunrise 
        ? new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : undefined,
      sunset: currentData.sys?.sunset 
        ? new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : undefined,
    },

    forecast,
    airQuality,
  };
}