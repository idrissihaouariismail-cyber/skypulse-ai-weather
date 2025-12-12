// src/components/Forecast.tsx
import React from "react";
import CloseButton from "./CloseButton";
import { ForecastItem, TemperatureUnit } from "../types";
import WeatherIcon from "./WeatherIcon";
import { useLanguage } from "../src/context/LanguageContext";

interface Props {
  forecast: ForecastItem[];
  unit: TemperatureUnit;
  onClose: () => void;
}

export default function Forecast({ forecast, unit, onClose }: Props) {
  const { t } = useLanguage();
  const demo = Array.from({ length: 5 }).map((_, i) => ({
    date: `Day ${i + 1}`,
    min: 10 + i,
    max: 20 + i,
    condition: "sunny",
  }));

  const data = forecast?.length ? forecast : demo;

  return (
    <div className="relative min-h-screen bg-black text-white">
      <CloseButton onClose={onClose} />
      <div className="relative pt-16 px-6">
        <h1 className="text-2xl font-semibold mb-6">{t("dayForecast")}</h1>

      <div className="mt-6 space-y-4">
        {data.map((f, idx) => (
          <div
            key={idx}
            className="p-4 bg-gray-800 rounded-xl flex items-center justify-between"
          >
            <div>
              <div className="text-lg font-semibold">{f.date}</div>
              <div className="text-gray-300">
                {f.min}°{unit} / {f.max}°{unit}
              </div>
            </div>

            <WeatherIcon condition={f.condition || "clear"} size={48} />
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}