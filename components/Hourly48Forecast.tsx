import React, { useMemo } from "react";
import WeatherIcon from "./WeatherIcon";
import { TemperatureUnit } from "../types";
import { useLanguage } from "../src/context/LanguageContext";
import { formatHourLabel } from "../src/utils/date";

interface HourlyData {
  time: string;
  temp: number;
  condition: string;
}

interface Props {
  data?: HourlyData[];
  unit: TemperatureUnit;
}

export default function Hourly48Forecast({ data, unit }: Props) {
  const { t, language } = useLanguage();
  
  // Helper: Translate condition (memoized to prevent recreation)
  const translateCondition = React.useCallback((condition: string): string => {
    if (!condition || typeof condition !== 'string') return t("clear");
    const lower = condition.toLowerCase();
    if (lower.includes("clear") || lower.includes("sunny")) return t("clear");
    if (lower.includes("partly") || lower.includes("partially")) return t("partly_cloudy");
    if (lower.includes("cloudy") || lower.includes("overcast")) return t("cloudy");
    if (lower.includes("light rain") || lower.includes("drizzle")) return t("light_rain");
    if (lower.includes("heavy rain")) return t("heavy_rain");
    if (lower.includes("rain") && !lower.includes("light") && !lower.includes("heavy")) return t("rain");
    if (lower.includes("light snow")) return t("light_snow");
    if (lower.includes("heavy snow")) return t("heavy_snow");
    if (lower.includes("snow") && !lower.includes("light") && !lower.includes("heavy")) return t("snow");
    if (lower.includes("thunder") || lower.includes("storm")) return t("thunderstorm");
    if (lower.includes("haze")) return t("haze");
    if (lower.includes("fog") || lower.includes("mist")) return t("fog");
    return t("clear");
  }, [t]);
  
  // CRITICAL: Memoize hourly data to prevent recalculation on every render
  // This ensures forecast stability when AI interest changes
  const hourlyData = useMemo(() => {
    // Defensive: Validate input data
    if (data && Array.isArray(data) && data.length > 0) {
      // Filter and validate each item
      const validData = data
        .slice(0, 48)
        .filter((h): h is HourlyData => 
          h && 
          typeof h === 'object' &&
          typeof h.temp === 'number' && 
          !isNaN(h.temp) &&
          h.condition && 
          typeof h.condition === 'string'
        );
      
      if (validData.length > 0) {
        return validData;
      }
    }
    
    // Fallback: Generate stable fallback data (memoized)
    const hours: HourlyData[] = [];
    const now = new Date();
    const conditions = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Rain", "Sunny"];
    
    for (let i = 0; i < 48; i++) {
      const hour = new Date(now);
      hour.setHours(now.getHours() + i);
      
      hours.push({
        time: formatHourLabel(hour, language),
        temp: Math.round(20 + Math.sin(i / 8) * 5), // Remove Math.random() for stability
        condition: conditions[i % conditions.length], // Use modulo for stable pattern
      });
    }
    
    return hours;
  }, [data, language]); // Only recalculate when data or language changes

  const formatHour = (timeStr: string): string => {
    // If timeStr is already formatted by formatHourLabel, return as is
    // Otherwise, try to parse and format
    try {
      // Check if it's a date string or already formatted
      if (timeStr.includes(":") || timeStr.includes("h") || /[٠-٩]/.test(timeStr)) {
        // Already formatted, return as is
        return timeStr;
      }
      // Try to parse as date
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return formatHourLabel(date, language);
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="mt-6 px-4">
      <div className="mb-3">
        <div className="text-white font-semibold text-base">{t("hourForecast")}</div>
        <div className="text-xs text-gray-400 mt-1">{t("scrollToViewHourly")}</div>
      </div>

      <div className="overflow-x-auto scroll-smooth scrollbar-hide">
        {/* Fixed spacing: use consistent gap for all screen sizes */}
        <div className="flex pb-2" style={{ gap: "1rem" }}>
          {hourlyData.map((hour, idx) => {
            // Defensive: Ensure hour data is valid
            if (!hour || typeof hour.temp !== 'number' || !hour.condition) {
              return null;
            }
            
            // Use hour.time if available, otherwise calculate from index
            const hourLabel = hour.time || (() => {
              const now = new Date();
              const hourDate = new Date(now.getTime() + idx * 60 * 60 * 1000);
              return formatHourLabel(hourDate, language);
            })();
            
            return (
            <div
              key={`hour-${idx}-${hour.time || idx}`}
              className="bg-transparent flex flex-col items-center min-w-[56px] flex-shrink-0 py-2 border-b-2 border-transparent hover:border-gray-500 transition-colors"
            >
              <div className="text-xs text-gray-300 mb-2">
                {hourLabel}
              </div>
              
              <div className="flex justify-center mb-2">
                <WeatherIcon condition={hour.condition} size={40} />
              </div>
              
              <div className="text-center">
                <div className="text-sm font-semibold text-white mb-1">
                  {Math.round(hour.temp)}°{unit}
                </div>
                <div className="text-[10px] text-gray-400 line-clamp-2">
                  {translateCondition(hour.condition)}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

