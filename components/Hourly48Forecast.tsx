import React, { useMemo } from "react";
import { TemperatureUnit } from "../types";
import { useLanguage } from "../src/context/LanguageContext";
import { formatHourLabel, formatHourLabelFromUtc } from "../src/utils/date";
import { resolveIconFromNormalizedSlot, getIconPath } from "../src/utils/weatherIcons";
import type { HourlyItem } from "../types";

interface Props {
  data?: HourlyItem[];
  unit: TemperatureUnit;
  sunriseSunset?: { sunrise: number; sunset: number };
  /** City timezone offset from UTC (seconds); for real local hour labels */
  timezoneOffsetSeconds?: number;
}

export default function Hourly48Forecast({ data, unit, sunriseSunset, timezoneOffsetSeconds }: Props) {
  const { t, language } = useLanguage();

  const hourlyData = useMemo(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      const validData = data
        .slice(0, 48)
        .filter((h): h is HourlyItem => h != null && typeof h === "object" && typeof (h.temp ?? (h as HourlyItem).temperature) === "number" && !isNaN((h.temp ?? (h as HourlyItem).temperature) as number));
      if (validData.length > 0) return validData;
    }
    return [];
  }, [data]);

  const tzSeconds = timezoneOffsetSeconds ?? 0;
  const getHourLabel = (hour: HourlyItem, _idx: number): string => {
    if (typeof hour.dt === "number") {
      return formatHourLabelFromUtc(hour.dt, tzSeconds, language);
    }
    if (hour.time) return hour.time;
    if (typeof hour.timestamp === "number") {
      return formatHourLabelFromUtc(Math.floor(hour.timestamp / 1000), tzSeconds, language);
    }
    return "—";
  };

  return (
    <div className="mt-6 px-4">
      <div className="mb-3">
        <div className="text-white font-semibold text-base">{t("hourForecast")}</div>
        <div className="text-xs text-gray-400 mt-1">{t("scrollToViewHourly")}</div>
      </div>

      <div className="overflow-x-auto scroll-smooth scrollbar-hide">
        <div className="flex pb-2" style={{ gap: "1rem" }}>
          {hourlyData.map((hour, idx) => {
            const temp = hour.temp ?? (hour as HourlyItem).temperature ?? 0;
            if (typeof temp !== "number" || isNaN(temp)) return null;

            const hourLabel = getHourLabel(hour, idx);
            const iconIndex = resolveIconFromNormalizedSlot(hour, sunriseSunset, tzSeconds);
            const iconPath = getIconPath(iconIndex);

            return (
              <div
                key={`hour-${idx}-${hour.dt ?? hour.time ?? idx}`}
                className="flex flex-col items-center justify-center min-w-[80px] w-[80px] h-[140px] flex-shrink-0 rounded-[16px] border border-white/25 px-3 py-4 bg-transparent"
              >
                {/* Hour Label – derived from dt + timezone (real local hour) */}
                <div className="text-xs text-white/90 font-medium mb-3">
                  {hourLabel}
                </div>

                {/* Weather Icon */}
                <div 
                  className="flex-1 flex items-center justify-center mb-3" 
                  style={{ 
                    overflow: 'visible',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={iconPath}
                    alt={hour.condition ?? "weather"}
                    className="w-12 h-12"
                  />
                </div>

                {/* Temperature */}
                <div className="text-sm font-semibold text-white">
                  {Math.round(temp)}°{unit === TemperatureUnit.CELSIUS ? "C" : "F"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
