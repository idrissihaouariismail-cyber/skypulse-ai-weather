// src/components/AirQuality.tsx
import React from "react";
import CloseButton from "./CloseButton";

interface AirQualityProps {
  airQuality?: {
    aqi?: number;
    level?: string;
    recommendation?: string;
    components?: Record<string, number>;
  };
  onClose: () => void;
}

// Helper to get AQI category
function getAqiCategory(aqi: number | undefined): string {
  if (!aqi) return "Unknown";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// Helper to get AQI progress percentage (0-100)
function getAqiProgress(aqi: number | undefined): number {
  if (!aqi) return 0;
  // AQI scale is 0-500, but we'll cap display at 300 for better UX
  return Math.min((aqi / 300) * 100, 100);
}

// Helper to format pollutant values
function formatPollutantValue(key: string, value: number): string {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("pm2_5") || lowerKey.includes("pm2.5")) {
    return `${value} µg/m³`;
  }
  if (lowerKey.includes("pm10")) {
    return `${value} µg/m³`;
  }
  // For gases (CO, NO2, SO2, O3), use ppm
  return `${value} ppm`;
}

// Helper to format pollutant name
function formatPollutantName(key: string): string {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("pm2_5") || lowerKey.includes("pm2.5")) {
    return "PM2.5";
  }
  if (lowerKey.includes("pm10")) {
    return "PM10";
  }
  return key.toUpperCase();
}

// Default pollutants list in order
const defaultPollutants = [
  { key: "pm2_5", name: "PM2.5", icon: "🌫" },
  { key: "pm10", name: "PM10", icon: "🌫" },
  { key: "co", name: "CO", icon: "🌫" },
  { key: "no2", name: "NO2", icon: "🌫" },
  { key: "so2", name: "SO2", icon: "🌫" },
  { key: "o3", name: "O3", icon: "🌫" },
];

export default function AirQuality({ airQuality, onClose }: AirQualityProps) {
  const aqi = airQuality?.aqi ?? 56;
  const category = airQuality?.level || getAqiCategory(aqi);
  const recommendation = airQuality?.recommendation || 
    "The air quality is moderate. Consider limiting prolonged outdoor activities, especially if you have respiratory issues.";
  const components = airQuality?.components || {
    pm2_5: 12,
    pm10: 25,
    co: 2,
    no2: 0.05,
    so2: 0.02,
    o3: 0.04,
  };

  const aqiProgress = getAqiProgress(aqi);

  // Get recommendation title based on AQI
  const getRecommendationTitle = (aqi: number): string => {
    if (aqi <= 50) return "Air quality is good";
    if (aqi <= 100) return "Avoid outdoor activity";
    if (aqi <= 150) return "Limit outdoor activity";
    if (aqi <= 200) return "Avoid outdoor activity";
    return "Stay indoors";
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      <CloseButton onClose={onClose} />
      <div className="relative pt-16 px-6">
        <h1 className="text-2xl font-semibold mb-6">Air Quality</h1>

      {/* Main Content */}
      <div>
        {/* AQI Number */}
        <div className="text-7xl font-bold text-white mb-2">{aqi}</div>

        {/* AQI Category */}
        <div className="text-lg text-white mb-6">{category}</div>

        {/* AQI Progress Bar */}
        <div className="mb-8">
          <div className="text-sm text-white mb-2">Air Quality Index</div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${aqiProgress}%` }}
            />
          </div>
        </div>

        {/* Pollutants Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Pollutants</h2>
          <div className="space-y-3">
            {defaultPollutants.map((pollutant) => {
              const value = components[pollutant.key] || components[pollutant.key.replace("_", ".")] || 0;
              const displayName = formatPollutantName(pollutant.key);
              const displayValue = formatPollutantValue(pollutant.key, value);

              return (
                <div
                  key={pollutant.key}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl">
                    {pollutant.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-white mb-1">
                      {displayName}
                    </div>
                    <div className="text-sm text-gray-400">{displayValue}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommendation Card */}
      <div className="pb-8">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background Image Placeholder - using gradient as placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 opacity-20">
            <div className="absolute inset-0 bg-[url('/weather-images/clear.jpg')] bg-cover bg-center opacity-30" />
          </div>

          {/* Overlay Content */}
          <div className="relative p-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-2">
                {getRecommendationTitle(aqi)}
              </h3>
              <p className="text-sm text-white/90 leading-relaxed">
                {recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
