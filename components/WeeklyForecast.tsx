import React, { useState, useEffect } from "react";
import { getSevenDayForecast, getCoordinates } from "../services/weather";
import { TemperatureUnit } from "../types";
import WeatherIcon from "./WeatherIcon";

interface DailyForecast {
  day: string;
  date: string;
  tempMin: number;
  tempMax: number;
  icon: string;
  description: string;
}

interface WeeklyForecastProps {
  location: string;
  unit: TemperatureUnit;
}

const WeeklyForecast: React.FC<WeeklyForecastProps> = ({ location, unit }) => {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchForecast() {
      if (!location) return;

      setLoading(true);

      try {
        const coords = await getCoordinates(location);

        if (!coords) {
          console.log("No coordinates found for:", location);
          if (isMounted) setForecast([]);
          return;
        }

        const processedData = await getSevenDayForecast(coords.lat, coords.lon, unit);
        console.log("PROCESSED FORECAST DATA:", processedData);

        if (isMounted) {
          const processed = processedData.slice(0, 5).map((item: any) => {
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dateObj = new Date(item.date);
            const dayName = daysOfWeek[dateObj.getDay()];

            return {
              date: item.date,
              day: dayName,
              tempMin: Math.round(item.tempMin),
              tempMax: Math.round(item.tempMax),
              icon: item.icon,
              description: item.description,
            };
          });

          setForecast(processed);
        }
      } catch (error) {
        console.error("Error fetching forecast:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchForecast();

    return () => {
      isMounted = false;
    };
  }, [location, unit]);

  if (loading) {
    return (
      <div className="mt-6 p-4 bg-[#0e1117] rounded-2xl shadow-lg text-white">
        <h2 className="text-xl font-semibold mb-4 text-center text-blue-400">
          5-Day Forecast
        </h2>
        <div className="text-center text-storm-gray">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-[#0e1117] rounded-2xl shadow-lg text-white">
      <h2 className="text-xl font-semibold mb-4 text-center text-blue-400">
        5-Day Forecast
      </h2>

      {/* ⭐⭐⭐ Grid ديال 5 أيام ⭐⭐⭐ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {forecast.map((day, index) => (
          <div
            key={index}
            className="p-3 bg-[#1a1f2b] rounded-xl flex flex-col items-center hover:bg-[#232a3a] transition-all duration-300"
          >
            <p className="text-gray-400 text-sm">{day.day}</p>

            <WeatherIcon condition={day.description || day.icon} size={40} className="mb-1" />


            <p className="text-sm text-storm-gray">{day.description}</p>

            <p className="text-blue-300 font-semibold mt-1">
              {day.tempMax}° / {day.tempMin}°
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyForecast;