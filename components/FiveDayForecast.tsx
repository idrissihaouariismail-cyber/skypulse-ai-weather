import React from "react";
import { BackIcon } from "./Icons";
import WeatherIcon from "./WeatherIcon";

interface ForecastItem {
  date: string;
  max: number;
  min: number;
  condition: string;
}

interface Props {
  forecast: ForecastItem[];
  unit: string;
  onBack: () => void;
}

export default function FiveDayForecast({ forecast, unit, onBack }: Props) {
  const displayForecast = forecast.slice(0, 5);

  const formatDayName = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      // This component may not have language context, so we'll keep a simple fallback
      // If needed, this can be updated to use formatDayOfWeek with language prop
      return date.toLocaleDateString(undefined, { weekday: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-black pt-12 pb-6 px-4">
        <div className="flex items-center justify-center relative">
          <button
            onClick={onBack}
            className="absolute left-0 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition"
          >
            <BackIcon className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-semibold text-center">5-Day Forecast</h1>
        </div>
      </div>

      {/* Forecast List */}
      <div className="px-4 py-6 space-y-3">
        {displayForecast.map((item, idx) => (
          <div
            key={idx}
            className="bg-gray-800/80 rounded-xl p-4 flex items-center justify-between shadow-lg border border-gray-700/50"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="w-16 text-left">
                <div className="text-sm font-semibold text-white">
                  {formatDayName(item.date)}
                </div>
              </div>

              <div className="flex-shrink-0">
                <WeatherIcon condition={item.condition} size={48} />
              </div>

              <div className="flex-1">
                <div className="text-base font-semibold text-white">
                  {Math.round(item.max)}°{unit} / {Math.round(item.min)}°{unit}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.condition}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary Card */}
      <div className="px-4 pb-6 mt-auto">
        <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 rounded-xl p-5 shadow-lg">
          <div className="font-bold text-lg text-white mb-2">AI Summary</div>
          <div className="text-sm text-white/95 leading-relaxed">
            Expect a cool evening with a high chance of rain. Temperatures will drop steadily throughout the night.
          </div>
        </div>
      </div>
    </div>
  );
}