// src/components/Dashboard.tsx

import React, { useState, useMemo, useCallback } from "react";
import { WeatherData, Settings, TemperatureUnit } from "../types";
import WeatherBackground from "./WeatherBackground";
import RadarPreview from "./RadarPreview";
import { SearchIcon } from "./Icons";
import Hourly48Forecast from "./Hourly48Forecast";
import WeatherIcon from "./WeatherIcon";
import { useLanguage } from "../src/context/LanguageContext";
import { formatDashboardDate, formatDayOfWeek } from "../src/utils/date";
import SunriseSunsetCard from "./SunriseSunsetCard";

interface Props {
  weatherData: WeatherData;
  settings: Settings;
  goTo: (view: any) => void;
  onSearch: (query: string) => void;
  showLocationButton?: boolean;
  showLocationHelper?: boolean;
  onRequestLocation?: () => void;
}

// Helper: Get AQI category and enhanced health advisory with group-specific recommendations
// All text is fully localized using translation keys
function getAqiInfo(aqi: number | null | undefined, t: (key: string) => string): { category: string; advisory: string } {
  if (aqi === null || aqi === undefined) {
    return { category: t("unknown"), advisory: t("airQualityDataUnavailable") };
  }

  // 0-50: Good
  if (aqi <= 50) {
    return {
      category: t("good"),
      advisory: `${t("air.good.general")} ${t("air.good.athletes")} ${t("air.good.respiratory")} ${t("air.good.children")} ${t("air.good.windows")}`
    };
  }

  // 51-100: Moderate
  if (aqi <= 100) {
    return {
      category: t("moderate"),
      advisory: `${t("air.moderate.general")} ${t("air.moderate.athletes")} ${t("air.moderate.respiratory")} ${t("air.moderate.children")} ${t("air.moderate.windows")}`
    };
  }

  // 101-150: Unhealthy for Sensitive Groups
  if (aqi <= 150) {
    return {
      category: t("unhealthyForSensitiveGroups"),
      advisory: `${t("air.sensitive.general")} ${t("air.sensitive.athletes")} ${t("air.sensitive.respiratory")} ${t("air.sensitive.children")} ${t("air.sensitive.windows")}`
    };
  }

  // 151-200: Unhealthy
  if (aqi <= 200) {
    return {
      category: t("unhealthy"),
      advisory: `${t("air.unhealthy.general")} ${t("air.unhealthy.athletes")} ${t("air.unhealthy.respiratory")} ${t("air.unhealthy.children")} ${t("air.unhealthy.windows")}`
    };
  }

  // 201-300: Very Unhealthy
  if (aqi <= 300) {
    return {
      category: t("veryUnhealthy"),
      advisory: `${t("air.veryUnhealthy.general")} ${t("air.veryUnhealthy.athletes")} ${t("air.veryUnhealthy.respiratory")} ${t("air.veryUnhealthy.children")} ${t("air.veryUnhealthy.windows")}`
    };
  }

  // 300+: Hazardous
  return {
    category: t("hazardous"),
    advisory: `${t("air.hazardous.general")} ${t("air.hazardous.athletes")} ${t("air.hazardous.respiratory")} ${t("air.hazardous.children")} ${t("air.hazardous.windows")}`
  };
}


// Helper: Translate weather condition
function translateCondition(condition: string | undefined, t: (key: string) => string): string {
  if (!condition) return t("clear");
  const lower = condition.toLowerCase();
  
  // Map common condition strings to translation keys
  if (lower.includes("clear") || lower.includes("sunny")) return t("clear");
  if (lower.includes("partly") || lower.includes("partially")) return t("partly_cloudy");
  if (lower.includes("cloudy") || lower.includes("overcast")) return t("cloudy");
  if (lower.includes("light rain") || lower.includes("drizzle")) return t("light_rain");
  if (lower.includes("heavy rain") || lower.includes("heavy rain")) return t("heavy_rain");
  if (lower.includes("rain") && !lower.includes("light") && !lower.includes("heavy")) return t("rain");
  if (lower.includes("light snow")) return t("light_snow");
  if (lower.includes("heavy snow")) return t("heavy_snow");
  if (lower.includes("snow") && !lower.includes("light") && !lower.includes("heavy")) return t("snow");
  if (lower.includes("thunder") || lower.includes("storm")) return t("thunderstorm");
  if (lower.includes("haze")) return t("haze");
  if (lower.includes("fog") || lower.includes("mist")) return t("fog");
  
  return t("clear"); // Default fallback
}

// Helper: Generate detailed AI insight (fully localized using i18n keys)
// Analyzes conditions and combines multiple contextual insights
// selectedInterest: "general" | "driving" | "travel" | "sports" | "fishing" | "sea" | "health" | "agriculture"
function generateAIInsight(current: any, temp: number, unit: string, language: string, t: (key: string) => string, selectedInterest: string = "general"): string {
  const condition = current.condition?.toLowerCase() || "";
  const wind = current.windSpeed ?? 0;
  const uv = current.uvIndex ?? 0;
  const humid = current.humidity ?? 0;
  const visibility = current.visibility ?? null; // in km or miles
  const now = new Date();
  const hour = now.getHours();

  const insights: string[] = [];
  const insightsByCategory: { [key: string]: string[] } = {
    general: [],
    driving: [],
    travel: [],
    sports: [],
    fishing: [],
    sea: [],
    health: [],
    agriculture: [],
  };

  // 1. GENERAL CONDITION-BASED INSIGHT
  let generalCondition = "";
  if (condition.includes("clear") && !condition.includes("cloud")) {
    generalCondition = t("ai.clear.general");
  } else if (condition.includes("partly") || condition.includes("partially")) {
    generalCondition = t("ai.partly_cloudy.general");
  } else if (condition.includes("cloudy") || condition.includes("overcast")) {
    generalCondition = t("ai.cloudy.general");
  } else if (condition.includes("heavy rain") || condition.includes("heavy rain")) {
    generalCondition = t("ai.heavy_rain.general");
  } else if (condition.includes("light rain") || condition.includes("drizzle")) {
    generalCondition = t("ai.light_rain.general");
  } else if (condition.includes("rain")) {
    generalCondition = t("ai.rain.general");
  } else if (condition.includes("heavy snow")) {
    generalCondition = t("ai.heavy_snow.general");
  } else if (condition.includes("snow")) {
    generalCondition = t("ai.snow.general");
  } else if (condition.includes("thunder") || condition.includes("storm")) {
    generalCondition = t("ai.thunderstorm.general");
  } else if (condition.includes("fog")) {
    generalCondition = t("ai.fog.general");
  } else if (condition.includes("mist")) {
    generalCondition = t("ai.mist.general");
  } else if (condition.includes("haze")) {
    generalCondition = t("ai.haze.general");
  }
  if (generalCondition) {
    insightsByCategory.general.push(generalCondition);
    insightsByCategory.agriculture.push(generalCondition);
  }

  // 2. DRIVING & VISIBILITY ADVICE
  const hasLowVisibility = visibility !== null && visibility < 5;
  const hasVeryLowVisibility = visibility !== null && visibility < 1;
  const isFoggy = condition.includes("fog") || condition.includes("mist") || condition.includes("haze");
  const isRainy = condition.includes("rain");
  const isSnowy = condition.includes("snow");
  const isWindy = wind >= 30;

  if (hasVeryLowVisibility || (isFoggy && visibility === null)) {
    insightsByCategory.driving.push(t("ai.driving.low.visibility"));
  } else if (hasLowVisibility) {
    insightsByCategory.driving.push(t("ai.driving.low.visibility"));
  } else if (!isFoggy && !isRainy && !isSnowy) {
    insightsByCategory.driving.push(t("ai.driving.good"));
  }

  if (isRainy && condition.includes("heavy")) {
    insightsByCategory.driving.push(t("ai.driving.heavy.rain"));
  } else if (isRainy || isSnowy) {
    insightsByCategory.driving.push(t("ai.driving.slippery"));
  }

  if (isSnowy) {
    insightsByCategory.driving.push(t("ai.driving.snow.ice"));
  }

  if (isWindy) {
    insightsByCategory.driving.push(t("ai.driving.windy"));
  }

  // 3. TRAVEL ADVICE (AIR & ROAD)
  const isGoodForTravel = !condition.includes("storm") && !condition.includes("thunder") && wind < 50 && !hasVeryLowVisibility;
  
  if (isGoodForTravel && !isFoggy && !isRainy) {
    insightsByCategory.travel.push(t("ai.travel.ok"));
  } else if (isRainy && condition.includes("heavy")) {
    insightsByCategory.travel.push(t("ai.travel.delays_rain"));
  } else if (isFoggy || hasVeryLowVisibility) {
    insightsByCategory.travel.push(t("ai.travel.delays_fog"));
  } else if (isSnowy) {
    insightsByCategory.travel.push(t("ai.travel.delays_snow"));
  }

  if (wind >= 30) {
    insightsByCategory.travel.push(t("ai.travel.windy"));
    insightsByCategory.travel.push(t("ai.travel.turbulence"));
  } else if (isGoodForTravel) {
    insightsByCategory.travel.push(t("ai.travel.smooth"));
  }

  // 4. SPORTS ACTIVITIES
  const isGoodForSports = temp >= 5 && temp <= 25 && !isRainy && !condition.includes("storm") && !hasLowVisibility;
  
  if (isGoodForSports) {
    insightsByCategory.sports.push(t("ai.sports.perfect"));
  } else if (hasLowVisibility || isFoggy) {
    insightsByCategory.sports.push(t("ai.sports.low_visibility"));
  } else if (condition.includes("thunder") || condition.includes("storm")) {
    insightsByCategory.sports.push(t("ai.sports.avoid_thunder"));
  } else if (temp > 30) {
    insightsByCategory.sports.push(t("ai.sports.heat_warning"));
  } else if (temp < 5) {
    insightsByCategory.sports.push(t("ai.sports.cold_warning"));
  }

  if (isRainy || isSnowy) {
    insightsByCategory.sports.push(t("ai.sports.wet_conditions"));
  }

  if (isWindy) {
    insightsByCategory.sports.push(t("ai.sports.windy"));
  }

  // 5. SEA & FISHING CONDITIONS
  if (wind < 20 && !isRainy && !condition.includes("storm")) {
    insightsByCategory.sea.push(t("ai.sea.good"));
    insightsByCategory.sea.push(t("ai.sea.calm"));
    insightsByCategory.fishing.push(t("ai.sea.good"));
    insightsByCategory.fishing.push(t("ai.sea.calm"));
  } else if (wind >= 30 || condition.includes("storm")) {
    insightsByCategory.sea.push(t("ai.sea.rough_sea"));
    insightsByCategory.fishing.push(t("ai.sea.rough_sea"));
  } else if (wind >= 20) {
    insightsByCategory.sea.push(t("ai.sea.strong_wind"));
    insightsByCategory.sea.push(t("ai.sea.moderate"));
    insightsByCategory.fishing.push(t("ai.sea.strong_wind"));
    insightsByCategory.fishing.push(t("ai.sea.moderate"));
  }

  if (hasLowVisibility || isFoggy) {
    insightsByCategory.sea.push(t("ai.sea.poor_visibility"));
    insightsByCategory.fishing.push(t("ai.sea.poor_visibility"));
  }

  // 6. CLOTHING SUGGESTIONS (for general and agriculture)
  if (temp >= 35) {
    insightsByCategory.general.push(t("ai.clothing.extreme_heat"));
    insightsByCategory.agriculture.push(t("ai.clothing.extreme_heat"));
  } else if (temp >= 30) {
    insightsByCategory.general.push(t("ai.clothing.hot"));
    insightsByCategory.agriculture.push(t("ai.clothing.hot"));
  } else if (temp <= -5) {
    insightsByCategory.general.push(t("ai.clothing.freezing"));
    insightsByCategory.agriculture.push(t("ai.clothing.freezing"));
  } else if (temp <= 5) {
    insightsByCategory.general.push(t("ai.clothing.cold"));
    insightsByCategory.agriculture.push(t("ai.clothing.cold"));
  }

  if (isRainy) {
    insightsByCategory.general.push(t("ai.clothing.rain"));
    insightsByCategory.agriculture.push(t("ai.clothing.rain"));
  }

  if (isWindy) {
    insightsByCategory.general.push(t("ai.clothing.wind"));
    insightsByCategory.agriculture.push(t("ai.clothing.wind"));
  }

  // 7. HEALTH WARNINGS
  if (temp >= 35) {
    insightsByCategory.health.push(t("ai.health.heat_extreme"));
  } else if (temp >= 30) {
    insightsByCategory.health.push(t("ai.health.heat_advisory"));
  } else if (temp <= -5) {
    insightsByCategory.health.push(t("ai.health.cold_extreme"));
  } else if (temp <= 0) {
    insightsByCategory.health.push(t("ai.health.cold_freezing"));
  } else if (temp <= 5) {
    insightsByCategory.health.push(t("ai.health.cold_stress"));
  }

  if (uv >= 8) {
    insightsByCategory.health.push(t("ai.health.uv_very_high"));
    insightsByCategory.fishing.push(t("ai.health.uv_very_high"));
  } else if (uv >= 6) {
    insightsByCategory.health.push(t("ai.health.uv_high"));
    insightsByCategory.fishing.push(t("ai.health.uv_high"));
  } else if (uv >= 3) {
    insightsByCategory.health.push(t("ai.health.uv_moderate"));
  } else if (uv > 0) {
    insightsByCategory.health.push(t("ai.health.uv_low"));
  }

  if (humid >= 80 && temp >= 25) {
    insightsByCategory.health.push(t("ai.health.humidity_high"));
    insightsByCategory.agriculture.push(t("ai.health.humidity_high"));
  } else if (humid >= 70) {
    insightsByCategory.health.push(t("ai.health.humidity_elevated"));
    insightsByCategory.agriculture.push(t("ai.health.humidity_elevated"));
  }

  // Get insights for selected interest category
  let filteredInsights: string[] = [];
  
  if (selectedInterest === "general") {
    // General: Combine all categories, prioritize general condition
    filteredInsights = [
      ...insightsByCategory.general,
      ...insightsByCategory.driving.slice(0, 1),
      ...insightsByCategory.travel.slice(0, 1),
      ...insightsByCategory.sports.slice(0, 1),
      ...insightsByCategory.health.slice(0, 2),
    ];
  } else {
    // Get insights for the selected category
    filteredInsights = insightsByCategory[selectedInterest] || [];
    
    // If no specific insights, add general condition as fallback
    if (filteredInsights.length === 0 && insightsByCategory.general.length > 0) {
      filteredInsights = [insightsByCategory.general[0]];
    }
  }
  
  // Remove duplicates and format as readable sentences
  // Filter out any raw keys (keys that start with "ai.") - these indicate missing translations
  const uniqueInsights = Array.from(new Set(filteredInsights))
    .filter(insight => {
      // Remove empty strings and any raw translation keys (keys that weren't translated)
      const trimmed = insight?.trim() || "";
      // If it looks like a translation key (starts with "ai."), filter it out
      // This ensures we only show actual translated text, not raw keys
      return trimmed.length > 0 && !trimmed.startsWith("ai.");
    });
  
  // CRITICAL: Always return a valid result - never empty or undefined
  // Fallback to safe generic message if no insights found
  if (uniqueInsights.length === 0) {
    // Safe fallback messages for each interest category
    const fallbackMessages: { [key: string]: string } = {
      general: t("ai.clear.general") || "Current weather conditions are being analyzed.",
      driving: t("ai.driving.good") || "Road conditions are normal. Drive safely.",
      travel: t("ai.travel.ok") || "Travel conditions are favorable.",
      sports: t("ai.sports.perfect") || "Weather conditions are suitable for outdoor activities.",
      fishing: t("ai.sea.good") || "Fishing conditions are favorable.",
      sea: t("ai.sea.good") || "Sea conditions are normal.",
      health: t("ai.health.uv_moderate") || "Air quality and health conditions are within normal ranges.",
      agriculture: t("ai.clear.general") || "Weather conditions are suitable for agricultural activities.",
    };
    
    const fallback = fallbackMessages[selectedInterest] || fallbackMessages.general;
    return fallback.endsWith(".") ? fallback : fallback + ".";
  }
  
  // Join insights with proper sentence formatting
  // Each insight should be a complete sentence, so we join with spaces
  // and ensure proper punctuation
  const result = uniqueInsights
    .map(insight => {
      // Ensure each insight ends with proper punctuation
      const trimmed = insight.trim();
      if (trimmed && !trimmed.match(/[.!?]$/)) {
        return trimmed + ".";
      }
      return trimmed;
    })
    .join(" "); // Join with single space for natural reading flow
  
  // Final safety check: ensure result is never empty
  return result || (t("ai.clear.general") || "Weather conditions are being analyzed.");
}

function Dashboard({ weatherData, settings, goTo, onSearch, showLocationButton = false, showLocationHelper = false, onRequestLocation }: Props) {
  const { t, language } = useLanguage();
  
  // Defensive: Ensure weatherData and current exist with safe defaults
  const current = weatherData?.current || {};
  const unit = settings.unit;
  const [searchInput, setSearchInput] = useState("");
  const [selectedInterest, setSelectedInterest] = useState<string>("general");

  // Memoize interest change handler to prevent unnecessary re-renders
  const handleInterestChange = useCallback((interestId: string) => {
    setSelectedInterest(interestId);
    // Only updates state - no data fetching or recalculation
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
    setSearchInput("");
  };

  // Defensive: Safe defaults for all weather values
  const temp = Math.round(current.temperature ?? 0);
  const loc = current.location ?? (t("unknown") || "Unknown");
  const date = formatDashboardDate(new Date(), language);

  const humidity = `${current.humidity ?? 0}%`;
  const wind =
    unit === TemperatureUnit.CELSIUS
      ? `${Math.round(current.windSpeed ?? 0)} km/h`
      : `${Math.round((current.windSpeed ?? 0) * 0.62)} mph`;
  const pressure = `${current.pressure ?? 1012} hPa`;
  const uvIndex = current.uvIndex ?? 0;

  const aqi = weatherData?.airQuality?.aqi ?? null;
  const aqiInfo = getAqiInfo(aqi, t);
  
  // Memoize AI Insight to prevent recalculation when unrelated state changes
  // Only recalculates when current weather data or selectedInterest changes
  const aiInsight = useMemo(() => {
    return generateAIInsight(
      current, 
      temp, 
      unit === TemperatureUnit.CELSIUS ? "C" : "F", 
      language, 
      t, 
      selectedInterest
    );
  }, [current, temp, unit, language, t, selectedInterest]);
  
  // Memoize interest options to prevent recreation on every render
  const interests = useMemo(() => [
    { id: "general", icon: "🌍", label: t("interest.general") },
    { id: "driving", icon: "🚗", label: t("interest.driving") },
    { id: "travel", icon: "✈", label: t("interest.travel") },
    { id: "sports", icon: "🏃", label: t("interest.sports") },
    { id: "fishing", icon: "🎣", label: t("interest.fishing") },
    { id: "sea", icon: "🌊", label: t("interest.sea") },
    { id: "health", icon: "🌬", label: t("interest.health") },
    { id: "agriculture", icon: "☀", label: t("interest.agriculture") },
  ], [t]);

  // CRITICAL: Memoize forecast data to prevent recalculation when interest changes
  // Forecast data is stable and only depends on weatherData, not UI state
  const forecast = useMemo(() => {
    const forecastData = weatherData?.forecast || [];
    // Defensive: Ensure we have valid forecast items
    if (!Array.isArray(forecastData) || forecastData.length === 0) {
      return [];
    }
    // Return first 5 items with defensive checks
    return forecastData.slice(0, 5).filter(f => f && f.date && typeof f.max === 'number' && typeof f.min === 'number');
  }, [weatherData?.forecast]);
  
  // CRITICAL: Memoize hourly data to prevent recalculation when interest changes
  // Hourly forecast is stable and only depends on weatherData, not UI state
  const hourlyData = useMemo(() => {
    const hourly = (weatherData as any)?.hourly;
    // Defensive: Ensure we have valid hourly data
    if (!Array.isArray(hourly) || hourly.length === 0) {
      return undefined; // Let Hourly48Forecast handle fallback
    }
    // Return valid hourly items only
    return hourly.filter((h: any) => h && (h.time || h.date) && typeof h.temp === 'number');
  }, [(weatherData as any)?.hourly]);

  return (
    <div className="min-h-screen bg-black text-white m-0 p-0">
      {/* HEADER - Full width, perfect rectangle, no rounded corners */}
      <div className="relative w-screen h-64 overflow-hidden rounded-none m-0 p-0">
        <WeatherBackground
          condition={(current.condition || "clear").toLowerCase()}
        />
      </div>

      {/* SEARCH BAR - Fixed at top, floating inside header */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[85%] max-w-md">
        <form onSubmit={handleSearchSubmit} className="m-0 p-0">
          <div className="bg-black/20 backdrop-blur-md rounded-full px-4 py-2.5 flex items-center gap-3 border border-white/10 shadow-lg">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("search")}
              className="flex-1 bg-transparent text-white placeholder-white text-sm outline-none"
            />
            <button type="submit" className="flex-shrink-0">
              <SearchIcon className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </form>
        
        {/* "Use my location" button - shown below search bar when silent detection fails */}
        {showLocationButton && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <button
              onClick={onRequestLocation}
              className="px-4 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition backdrop-blur-sm border border-white/20"
            >
              📍 Use my location
            </button>
            {showLocationHelper && (
              <p className="text-[10px] text-white/60 text-center px-2">
                Please enable location services on your device.
              </p>
            )}
          </div>
        )}
      </div>

      {/* TEMPERATURE + LOCATION */}
      <div className="text-center mt-6 px-4">
        <div className="text-6xl font-bold">{temp}°{unit}</div>
        <div className="text-gray-300 mt-2 text-sm">{loc} | {date}</div>
      </div>

      {/* 48-HOUR FORECAST - Stable data, doesn't change with interest selection */}
      <Hourly48Forecast data={hourlyData} unit={unit} />

      {/* AI INSIGHT CARD - Enhanced with detailed description */}
      <div className="mt-6 px-4">
        <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 rounded-xl p-5 text-white shadow-lg">
          <div className="font-bold text-lg mb-3">{t("aiInsight")}</div>
          <div className="text-sm leading-relaxed opacity-95 transition-opacity duration-300">
            {aiInsight}
          </div>
        </div>
        
        {/* Interest Selector - Horizontal scrollable chips */}
        <div 
          className="mt-3 overflow-x-auto" 
          style={{ 
            scrollbarWidth: "none", 
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            .interest-scroll::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="flex gap-2 pb-2 interest-scroll">
            {interests.map((interest) => (
              <button
                key={interest.id}
                onClick={() => handleInterestChange(interest.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all duration-200 shadow-md ${
                  selectedInterest === interest.id
                    ? "bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 text-white scale-105 shadow-lg"
                    : "bg-gradient-to-br from-amber-500/60 via-amber-400/50 to-amber-300/40 text-white/90 hover:from-amber-500/70 hover:via-amber-400/60 hover:to-amber-300/50 hover:scale-102"
                }`}
              >
                <span className="text-sm">{interest.icon}</span>
                <span>{interest.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 METRICS */}
      <div className="grid grid-cols-2 gap-4 mt-6 px-4">
        <MetricCard title={t("humidity")} value={humidity} />
        <MetricCard title={t("wind")} value={wind} />
        <MetricCard title={t("pressure")} value={pressure} />
        <MetricCard title={t("uv")} value={uvIndex} />
      </div>

      {/* SUNRISE & SUNSET - Semi-circle card */}
      <SunriseSunsetCard
        sunrise={current.sunrise}
        sunset={current.sunset}
      />

      {/* AIR QUALITY - Gold colored with more information */}
      <div className="mt-6 px-4">
        <div
          className="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 rounded-xl p-5 cursor-pointer shadow-lg"
          onClick={() => goTo({ id: "air_quality", name: t("airQuality") })}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-white/90 mb-1">{t("airQualityIndex")}</div>
              <div className="text-4xl font-bold text-white">{aqi ?? "—"}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white/90">{aqiInfo.category}</div>
            </div>
          </div>
          <div className="text-xs text-white/80 leading-relaxed mt-2">
            {aqiInfo.advisory}
          </div>
          <div className="text-xs text-white/70 mt-3 italic">{t("air.press.for.details")}</div>
        </div>
      </div>

      {/* 5-DAY FORECAST - Horizontal scroll carousel */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-semibold">{t("dayForecast")}</div>
          <button
            onClick={() => goTo({ id: "forecast", name: "Forecast" })}
            className="text-xs text-gray-400 hover:text-white transition"
          >
            {t("viewAll")}
          </button>
        </div>

        <div className="overflow-x-auto scroll-smooth scrollbar-hide pb-2">
          <div className="inline-flex gap-4" style={{ gap: "1rem" }}>
            {forecast.length > 0 ? (
              forecast.map((f, i) => (
                <div
                  key={i}
                  onClick={() => goTo({ id: "forecast", name: "Forecast" })}
                  className="bg-transparent flex flex-col items-center min-w-[80px] px-2 py-3 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                >
                  <div className="text-xs text-gray-300 mb-2 font-medium">
                    {formatDayOfWeek(f.date, language)}
                  </div>
                  <div className="mb-2 flex justify-center">
                    <WeatherIcon condition={f.condition || "clear"} size={40} />
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">
                    {Math.round(f.max)}° / {Math.round(f.min)}°
                  </div>
                  {(f as any).precipitation !== undefined && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {(f as any).precipitation}%
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 py-4">{t("forecastDataUnavailable")}</div>
            )}
          </div>
        </div>
      </div>

      {/* RADAR PREVIEW - Single title, clean design */}
      <div className="mt-6 px-4">
        <div
          className="rounded-xl border border-gray-700 bg-transparent overflow-hidden cursor-pointer"
          onClick={() => goTo({ id: "radar", name: "Radar" })}
        >
          <div className="p-4">
            <div className="text-lg font-bold mb-1">{t("radar")}</div>
            <div className="text-sm text-gray-400 mb-3">
              {t("liveWeatherPatterns")}
            </div>
            <div className="rounded-lg overflow-hidden">
              <RadarPreview />
            </div>
            <div className="text-xs text-gray-500 mt-3 text-center">{t("tapToViewFullRadar")}</div>
          </div>
        </div>
      </div>

      {/* AD PLACEHOLDER */}
      <div className="mt-6 px-4 text-center text-gray-500 text-xs">Ad</div>

      {/* SETTINGS BUTTON - At bottom of Dashboard */}
      <div className="px-4 pb-4 pt-6">
        <button
          onClick={() => goTo({ id: "settings", name: "Settings" })}
          className="w-full bg-gray-700 rounded-lg py-3 flex items-center justify-center hover:bg-gray-600 transition"
        >
          <span className="text-white font-medium">{t("settings")}</span>
        </button>
      </div>
    </div>
  );
}

const MetricCard = ({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) => (
  <div className="rounded-xl p-4 border border-white/15 bg-white/5 backdrop-blur-sm">
    <div className="text-sm text-gray-400">{title}</div>
    <div className="text-white text-xl font-semibold mt-2">{value}</div>
  </div>
);

export default Dashboard;
