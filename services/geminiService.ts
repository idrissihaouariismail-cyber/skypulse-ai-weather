import { GoogleGenAI, Type } from "@google/genai";
import { TemperatureUnit, WeatherData } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Fix: Removed `weatherFunctionDeclaration` and the `tools` config from the API call.
// `responseSchema` is the correct and sufficient method to request structured JSON,
// and the existing code is already set up to parse a JSON string from the response, not handle a function call.
export const getWeatherData = async (location: string, unit: TemperatureUnit): Promise<WeatherData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `What is the weather, 7-day forecast, and air quality in ${location}? Use ${unit} for temperature.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            current: {
              type: Type.OBJECT,
              properties: {
                location: { type: Type.STRING },
                temperature: { type: Type.NUMBER },
                condition: { type: Type.STRING },
                conditionIcon: { type: Type.STRING, description: "A string keyword for an icon, e.g., 'Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Thunderstorm', 'Windy'." },
                humidity: { type: Type.NUMBER, description: "Percentage" },
                windSpeed: { type: Type.NUMBER, description: "Speed in km/h or mph depending on unit" },
                pressure: { type: Type.NUMBER, description: "Pressure in hPa" },
                uvIndex: { type: Type.NUMBER },
                visibility: { type: Type.NUMBER, description: "Visibility in kilometers or miles" },
              },
            },
            forecast: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
                  day: { type: Type.STRING, description: "Day of the week, e.g., 'Monday'" },
                  tempMax: { type: Type.NUMBER },
                  tempMin: { type: Type.NUMBER },
                  condition: { type: Type.STRING },
                  conditionIcon: { type: Type.STRING, description: "A string keyword for an icon, e.g., 'Sunny', 'Cloudy', 'Rainy'" },
                },
              },
            },
            airQuality: {
              type: Type.OBJECT,
              properties: {
                aqi: { type: Type.NUMBER },
                pollutant: { type: Type.STRING, description: "Main pollutant, e.g., 'PM2.5'" },
                concentration: { type: Type.NUMBER, description: "Concentration in µg/m³" },
                recommendation: { type: Type.STRING },
                level: { type: Type.STRING, enum: ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'] },
              },
            },
          },
        },
      },
    });
    
    let jsonStr = response.text.trim();
    // Gemini can sometimes wrap the JSON in ```json ... ```, so we strip that.
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
    }
    
    const data = JSON.parse(jsonStr);
    
    // Simple validation
    if (!data.current || !data.forecast || !data.airQuality) {
        throw new Error("Invalid data structure from API");
    }

    return data as WeatherData;

  } catch (error) {
    console.error("Error fetching weather data from Gemini:", error);
    throw new Error("Could not retrieve weather data.");
  }
};
