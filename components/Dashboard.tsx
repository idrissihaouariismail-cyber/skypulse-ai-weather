// src/components/Dashboard.tsx
// All weather data from WeatherContext only; no independent interpretation.

import React, { useState, useCallback } from "react";
import { Settings, TemperatureUnit } from "../types";
import WeatherBackground from "./WeatherBackground";
import RadarPreview from "./RadarPreview";
import { SearchIcon } from "./Icons";
import Hourly48Forecast from "./Hourly48Forecast";
import { resolveIconFromNormalizedSlot, getIconPath } from "../src/utils/weatherIcons";
import { getBackgroundKeyFromCondition, isNightForSlot } from "../services/weatherCondition";
import { useLanguage } from "../src/context/LanguageContext";
import { useWeather } from "../src/context/WeatherContext";
import { formatDashboardDate, formatDayOfWeek } from "../src/utils/date";
import SunriseSunsetCard from "./SunriseSunsetCard";
import MoonBrightnessCard from "./MoonBrightnessCard";
import CitySearchAutocomplete, { City } from "./CitySearchAutocomplete";

interface Props {
  settings: Settings;
  goTo: (view: any) => void;
  onSearch: (query: string) => void;
  onCitySelect?: (city: City) => void;
  selectedCity?: { name?: string; country?: string; lat: number; lon: number } | null;
  showLocationButton?: boolean;
  showLocationHelper?: boolean;
  onRequestLocation?: () => void;
  onRequestRadar?: () => void;
}

// Helper to format pollutant values
function formatPollutantValue(key: string, value: number): string {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("pm2_5") || lowerKey.includes("pm2.5") || lowerKey.includes("pm25")) {
    return `${value.toFixed(1)} µg/m³`;
  }
  if (lowerKey.includes("pm10")) {
    return `${value.toFixed(1)} µg/m³`;
  }
  // For gases (CO, NO2, SO2, O3), use ppm
  return `${value.toFixed(3)} ppm`;
}

// Helper to format pollutant name
function formatPollutantName(key: string): string {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("pm2_5") || lowerKey.includes("pm2.5") || lowerKey.includes("pm25")) {
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

function Dashboard({ settings, goTo, onSearch, onCitySelect, selectedCity, showLocationButton = false, showLocationHelper = false, onRequestLocation, onRequestRadar }: Props) {
  const { t, language } = useLanguage();
  const { weather, derived } = useWeather();
  const current = weather?.current ?? {};
  const unit = settings.unit;
  const [showPollutants, setShowPollutants] = useState(false);

  const handleCitySelect = useCallback((city: City) => {
    if (onCitySelect) onCitySelect(city);
    else onSearch(`${city.lat},${city.lon}`);
  }, [onSearch, onCitySelect]);

  const temp = Math.round(current.temperature ?? 0);
  const loc =
    selectedCity?.name
      ? (selectedCity.country ? `${selectedCity.name}, ${selectedCity.country}` : selectedCity.name)
      : t("unknown");
  const date = formatDashboardDate(new Date(), language);

  const humidity = `${current.humidity ?? 0}%`;
  const wind =
    unit === TemperatureUnit.CELSIUS
      ? `${Math.round(current.windSpeed ?? 0)} km/h`
      : `${Math.round((current.windSpeed ?? 0) * 0.62)} mph`;
  const pressure = `${current.pressure ?? 1012} hPa`;
  const uvIndex = current.uvIndex ?? 0;

  const aqi = weather?.airQuality?.aqi ?? null;
  const aqiCategoryKey = derived?.aqiCategoryKey ?? "unknown";
  const aqiRangeTextKey = derived?.aqiRangeTextKey ?? "aqi.range.unavailable";
  const aiInsight = derived?.insightKeys ?? { feelKeys: ["aiInsight.feel.mild"] };

  const forecast = (weather?.forecast ?? []).slice(0, 5).filter((f) => f && f.date && typeof f.max === "number" && typeof f.min === "number");
  const hourlyData = (weather?.hourly ?? []).length > 0
    ? weather!.hourly!.filter((h) => h != null && typeof (h.temp ?? h.temperature) === "number" && !isNaN((h.temp ?? h.temperature) as number))
    : undefined;
  const sunriseSunset =
    current.sunrise != null && current.sunset != null
      ? { sunrise: current.sunrise, sunset: current.sunset }
      : undefined;
  const backgroundKey = getBackgroundKeyFromCondition(weather?.current ?? undefined, sunriseSunset);

  return (
    <div className="min-h-screen bg-black text-white m-0 p-0">
      {/* HEADER – same condition source as icons (unified) */}
      <div className="relative w-screen h-64 overflow-hidden rounded-none m-0 p-0">
        <WeatherBackground condition={backgroundKey} />
      </div>

      {/* SEARCH BAR - Fixed at top, floating inside header */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[85%] max-w-md">
        <div className="bg-black/20 backdrop-blur-md rounded-full px-4 py-2.5 flex items-center gap-3 border border-white/10 shadow-lg">
          <CitySearchAutocomplete
            onCitySelect={handleCitySelect}
            placeholder={t("search")}
            className="flex-1"
            initialValue={selectedCity && selectedCity.name && selectedCity.country
              ? `${selectedCity.name}, ${selectedCity.country}`
              : current.location && !/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(current.location.trim())
                ? current.location
                : ""}
          />
          <div className="flex-shrink-0 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-white/80" />
          </div>
        </div>
        
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
                {t("location.searchPrompt")}
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

      {/* 48-HOUR FORECAST – next 48h from current time; labels = real local hour from dt + timezone */}
      <Hourly48Forecast
        data={hourlyData}
        unit={unit}
        sunriseSunset={sunriseSunset}
        timezoneOffsetSeconds={weather?.timezoneOffsetSeconds}
      />

      {/* UNIFIED CONDITIONS – Weather + Air Quality in one card (max 4 lines; AQI badge only; no pollutants when Good) */}
      <div className="mt-6 px-4">
        <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="font-bold text-lg">{t("aiInsight.title")}</div>
            {aqi != null && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white/95">
                AQI {aqi} · {t(aqiCategoryKey)}
              </span>
            )}
          </div>
          <div className="space-y-1.5 text-sm leading-relaxed opacity-95">
            {aiInsight.feelKeys[0] && <div>{t(aiInsight.feelKeys[0])}</div>}
            {aiInsight.feelKeys[1] && <div>{t(aiInsight.feelKeys[1])}</div>}
            {aiInsight.feelKeys[2] && <div>{t(aiInsight.feelKeys[2])}</div>}
            {aqiCategoryKey !== "good" && aqi != null ? (
              <div>{t(aqiRangeTextKey)}</div>
            ) : (
              <div>{t("aiInsight.shortTermStable")}</div>
            )}
          </div>
          {aqiCategoryKey !== "good" && weather?.airQuality?.components && Object.keys(weather.airQuality.components).length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowPollutants(!showPollutants)}
                className="w-full flex items-center justify-between text-xs text-white/90 hover:text-white transition py-2"
              >
                <span className="font-semibold">Pollutants</span>
                <span className="text-lg">{showPollutants ? "−" : "+"}</span>
              </button>
              {showPollutants && (
                <div className="mt-3 space-y-2">
                  {defaultPollutants.map((pollutant) => {
                    const components = weather.airQuality?.components || {};
                    const value = components[pollutant.key] || 
                                  components[pollutant.key.replace("_", ".")] || 
                                  components[pollutant.key.toUpperCase()] || 
                                  components[pollutant.key.toLowerCase()] || 0;
                    if (value === 0) return null;
                    const displayName = formatPollutantName(pollutant.key);
                    const displayValue = formatPollutantValue(pollutant.key, value);
                    return (
                      <div
                        key={pollutant.key}
                        className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                          {pollutant.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white mb-0.5">{displayName}</div>
                          <div className="text-xs text-white/80">{displayValue}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
        sunrise={current.sunriseFormatted}
        sunset={current.sunsetFormatted}
      />

      {/* MOON BRIGHTNESS – night only, when API provides moon data */}
      {isNightForSlot(weather?.current ?? undefined, sunriseSunset, weather?.timezoneOffsetSeconds) &&
        weather?.moonIllumination != null && (
        <MoonBrightnessCard moonIllumination={weather.moonIllumination} />
      )}

      {/* 5-DAY FORECAST - Horizontal scroll carousel */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-semibold">{t("dayForecast")}</div>
        </div>

        <div className="overflow-x-auto scroll-smooth scrollbar-hide pb-2">
          <div className="inline-flex gap-4" style={{ gap: "1rem" }}>
            {forecast.length > 0 ? (
              forecast.map((f, i) => (
                <div
                  key={i}
                  className="bg-transparent flex flex-col items-center min-w-[80px] px-2 py-3 flex-shrink-0"
                >
                  <div className="text-xs text-gray-300 mb-2 font-medium">
                    {formatDayOfWeek(f.date, language)}
                  </div>
                  {/* Weather Icon - SPRITE SHEET, perfectly centered */}
                  <div 
                    className="mb-2 flex justify-center items-center" 
                    style={{ overflow: 'visible', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img
                      src={getIconPath(resolveIconFromNormalizedSlot(f.slot ?? undefined, sunriseSunset))}
                      alt={f.condition || "weather"}
                      className="w-10 h-10"
                    />
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
          onClick={() => (onRequestRadar ? onRequestRadar() : goTo({ id: "radar", name: "Radar" }))}
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
