import React from "react";

interface WeatherIconProps {
  condition: string;
  size?: number;
  className?: string;
}

export function getIcon(condition: string): string {
  const lower = condition?.toLowerCase().replace(/\s+/g, "_") || "";
  
  if (lower.includes("clear") && !lower.includes("night")) return "/weather-icons/clear.svg";
  if (lower.includes("partly_cloudy") || lower.includes("partly cloudy")) {
    return lower.includes("night") ? "/weather-icons/partly_cloudy_night.svg" : "/weather-icons/partly_cloudy.svg";
  }
  if (lower.includes("overcast") || (lower.includes("cloudy") && !lower.includes("partly"))) return "/weather-icons/overcast.svg";
  if (lower.includes("light_rain") || lower.includes("light rain") || lower.includes("drizzle")) return "/weather-icons/light_rain.svg";
  if (lower.includes("heavy_rain") || lower.includes("heavy rain")) return "/weather-icons/heavy_rain.svg";
  if (lower.includes("rain") && !lower.includes("light") && !lower.includes("heavy")) return "/weather-icons/light_rain.svg";
  if (lower.includes("thunder") || lower.includes("storm") && !lower.includes("snow") && !lower.includes("dust")) return "/weather-icons/thunderstorm.svg";
  if (lower.includes("light_snow") || lower.includes("light snow")) return "/weather-icons/light_snow.svg";
  if (lower.includes("heavy_snow") || lower.includes("heavy snow")) return "/weather-icons/heavy_snow.svg";
  if (lower.includes("blowing_snow") || lower.includes("blowing snow")) return "/weather-icons/blowing_snow.svg";
  if (lower === "snow" || lower.includes("snowy")) return "/weather-icons/light_snow.svg";
  if (lower === "fog" || lower.includes("foggy")) return "/weather-icons/fog.svg";
  if (lower.includes("dust") || lower.includes("sand")) return "/weather-icons/dust_storm.svg";
  if (lower.includes("windy") || lower.includes("wind")) return "/weather-icons/windy.svg";
  if (lower.includes("clear_night") || (lower.includes("night") && lower.includes("clear"))) return "/weather-icons/clear_night.svg";
  if (lower.includes("rainbow")) return "/weather-icons/rainbow.svg";
  if (lower.includes("humidity")) return "/weather-icons/humidity.svg";
  
  return "/weather-icons/clear.svg";
}

export default function WeatherIcon({
  condition,
  size = 64,
  className = "",
}: WeatherIconProps) {
  const iconPath = getIcon(condition);

  return (
    <img
      src={iconPath}
      alt={condition}
      width={size}
      height={size}
      className={className}
    />
  );
}
