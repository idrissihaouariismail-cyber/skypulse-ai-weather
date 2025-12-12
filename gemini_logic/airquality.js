import { IQAIR_API_KEY } from './config.js';

const IQAIR_BASE_URL = "https://api.airvisual.com/v2";

// --- Get Air Quality Data ---
async function getAirQuality(lat, lon) {
  try {
    const response = await fetch(`${IQAIR_BASE_URL}/nearest_city?lat=${lat}&lon=${lon}&key=${IQAIR_API_KEY}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status === "success") {
      return data.data;
    } else {
      console.error("IQAir API error:", data.data.message);
      return null;
    }
  } catch (error) {
    console.error("Error fetching air quality data:", error);
    return null;
  }
}

export { getAirQuality };