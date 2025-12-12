const VITE_OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string;

export async function getAirQuality(lat: number, lon: number) {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${VITE_OPENWEATHER_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Air quality API error: " + response.status);
  }

  const data = await response.json();

  // Extract clean data
  const aqi = data.list?.[0]?.main?.aqi ?? null;
  const components = data.list?.[0]?.components ?? {};

  return {
    aqi,
    components
  };
}