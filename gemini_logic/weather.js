import { OPENWEATHER_API_KEY } from './config.js';

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEOCODING_BASE_URL = "https://api.openweathermap.org/geo/1.0";

// --- Geocoding: Get Lat/Lon from City Name ---
async function getCoordinates(city) {
  try {
    const response = await fetch(`${GEOCODING_BASE_URL}/direct?q=${city}&limit=1&appid=${OPENWEATHER_API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
}

// --- Get Current Weather ---
async function getCurrentWeather(lat, lon, unit = 'metric') { // 'metric' for Celsius, 'imperial' for Fahrenheit
  try {
    const response = await fetch(`${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${OPENWEATHER_API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching current weather:", error);
    return null;
  }
}

// --- Get 7-Day Forecast ---
async function getSevenDayForecast(lat, lon, unit = 'metric') { // 'metric' for Celsius, 'imperial' for Fahrenheit
  try {
    // OpenWeatherMap's One Call API provides daily forecast for 8 days
    const response = await fetch(`${OPENWEATHER_BASE_URL}/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=${unit}&appid=${OPENWEATHER_API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.daily.slice(0, 7); // Return the first 7 days
  } catch (error) {
    console.error("Error fetching 7-day forecast:", error);
    return null;
  }
}

export { getCoordinates, getCurrentWeather, getSevenDayForecast };