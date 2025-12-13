// src/components/SunriseSunsetCard.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useLanguage } from "../src/context/LanguageContext";

interface Props {
  sunrise?: string;
  sunset?: string;
}

/**
 * Parse time string to Date object (today with the given time)
 */
function parseTimeToDate(timeStr: string | undefined): Date | null {
  if (!timeStr) return null;
  
  try {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return null;
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    // Check if it has AM/PM
    const upperStr = timeStr.toUpperCase();
    const isPM = upperStr.includes("PM");
    const isAM = upperStr.includes("AM");
    
    let hour24 = hours;
    if (isPM && hours !== 12) {
      hour24 = hours + 12;
    } else if (isAM && hours === 12) {
      hour24 = 0;
    }
    
    const date = new Date();
    date.setHours(hour24, minutes, 0, 0);
    return date;
  } catch {
    return null;
  }
}

/**
 * Format time string to 24-hour format with Western numbers
 */
function formatTime24Hour(timeStr: string | undefined, language: string): string {
  if (!timeStr) return "—";
  
  try {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        return "—";
      }
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      const locale =
        language === "ar" || language === "ar-MA" ? "ar-u-nu-latn" :
        language === "fr" ? "fr-FR" :
        "en-US";
      return new Intl.DateTimeFormat(locale, options).format(date);
    }
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    const upperStr = timeStr.toUpperCase();
    const isPM = upperStr.includes("PM");
    const isAM = upperStr.includes("AM");
    
    let hour24 = hours;
    if (isPM && hours !== 12) {
      hour24 = hours + 12;
    } else if (isAM && hours === 12) {
      hour24 = 0;
    }
    
    const hourStr = hour24.toString().padStart(2, "0");
    const minuteStr = minutes.toString().padStart(2, "0");
    
    return `${hourStr}:${minuteStr}`;
  } catch {
    return "—";
  }
}

/**
 * Calculate sun position on arc (0 = sunrise, 1 = sunset)
 * Returns position as percentage (0-100)
 */
function calculateSunPosition(sunrise: Date | null, sunset: Date | null): number {
  if (!sunrise || !sunset) return 50; // Default to middle
  
  const now = new Date();
  const sunriseTime = sunrise.getTime();
  const sunsetTime = sunset.getTime();
  const nowTime = now.getTime();
  
  // Before sunrise: position at 0% (far left)
  if (nowTime < sunriseTime) {
    return 0;
  }
  
  // After sunset: position at 100% (far right)
  if (nowTime > sunsetTime) {
    return 100;
  }
  
  // Between sunrise and sunset: calculate percentage
  const totalDuration = sunsetTime - sunriseTime;
  const elapsed = nowTime - sunriseTime;
  const percentage = (elapsed / totalDuration) * 100;
  
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Calculate day length in hours and minutes
 */
function calculateDayLength(sunrise: Date | null, sunset: Date | null): { hours: number; minutes: number } | null {
  if (!sunrise || !sunset) return null;
  
  const diffMs = sunset.getTime() - sunrise.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours: diffHours, minutes: diffMinutes };
}

/**
 * Check if current time is between sunrise and sunset (daytime)
 */
function isDaytime(sunrise: Date | null, sunset: Date | null): boolean {
  if (!sunrise || !sunset) return true; // Default to daytime
  
  const now = new Date();
  const nowTime = now.getTime();
  const sunriseTime = sunrise.getTime();
  const sunsetTime = sunset.getTime();
  
  return nowTime >= sunriseTime && nowTime <= sunsetTime;
}

export default function SunriseSunsetCard({ sunrise, sunset }: Props) {
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute for smooth sun movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Parse sunrise and sunset times
  const sunriseDate = useMemo(() => parseTimeToDate(sunrise), [sunrise]);
  const sunsetDate = useMemo(() => parseTimeToDate(sunset), [sunset]);
  
  // Calculate sun position and day state
  const sunPosition = useMemo(() => calculateSunPosition(sunriseDate, sunsetDate), [sunriseDate, sunsetDate, currentTime]);
  const isDay = useMemo(() => isDaytime(sunriseDate, sunsetDate), [sunriseDate, sunsetDate, currentTime]);
  const dayLength = useMemo(() => calculateDayLength(sunriseDate, sunsetDate), [sunriseDate, sunsetDate]);
  
  // Format times
  const sunriseTime = formatTime24Hour(sunrise, language);
  const sunsetTime = formatTime24Hour(sunset, language);
  
  // Format day length
  const dayLengthText = dayLength 
    ? `${t("dayLength")}: ${dayLength.hours}h ${dayLength.minutes}m`
    : "";
  
  // Calculate sun position on SVG arc (quadratic curve: M 25 50 Q 100 8, 175 50)
  // The curve: start (25, 50), control (100, 8), end (175, 50)
  // Convert percentage (0-100) to tParam parameter (0-1) for quadratic Bezier curve
  const tParam = sunPosition / 100; // 0 to 1
  
  // Quadratic Bezier formula: (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
  // P₀ = (25, 50), P₁ = (100, 8), P₂ = (175, 50)
  const sunX = (1 - tParam) * (1 - tParam) * 25 + 2 * (1 - tParam) * tParam * 100 + tParam * tParam * 175;
  const sunY = (1 - tParam) * (1 - tParam) * 50 + 2 * (1 - tParam) * tParam * 8 + tParam * tParam * 50;
  
  return (
    <div className="mt-6 px-4">
      <div 
        className={`relative backdrop-blur-md border rounded-t-[3rem] rounded-b-none overflow-hidden shadow-lg transition-all duration-500 ${
          isDay 
            ? "bg-gradient-to-b from-amber-500/10 via-orange-500/8 to-transparent border-amber-400/30" 
            : "bg-gradient-to-b from-blue-500/10 via-indigo-500/8 to-transparent border-blue-400/30"
        }`}
        style={{ height: "130px" }}
      >
        {/* Semi-circle arc background - sun path with day/night gradient */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="absolute top-6 w-full h-20"
            viewBox="0 0 200 60"
            preserveAspectRatio="none"
            style={{ overflow: "visible" }}
          >
            {/* Sun path arc - with day/night gradient */}
            <defs>
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {isDay ? (
                  <>
                    <stop offset="0%" stopColor="rgba(255, 200, 100, 0.4)" />
                    <stop offset="50%" stopColor="rgba(255, 180, 80, 0.5)" />
                    <stop offset="100%" stopColor="rgba(255, 200, 100, 0.4)" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="rgba(150, 180, 255, 0.3)" />
                    <stop offset="50%" stopColor="rgba(120, 150, 255, 0.35)" />
                    <stop offset="100%" stopColor="rgba(150, 180, 255, 0.3)" />
                  </>
                )}
              </linearGradient>
            </defs>
            <path
              d="M 25 50 Q 100 8, 175 50"
              stroke="url(#arcGradient)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              style={{ transition: "stroke 0.5s ease" }}
            />
            
            {/* Animated sun icon - moves along the arc */}
            <g
              transform={`translate(${sunX}, ${sunY})`}
              style={{
                transition: "transform 1s ease-out",
              }}
            >
              <circle
                cx="0"
                cy="0"
                r={isDay ? "6" : "5"}
                fill={isDay ? "rgba(255, 220, 100, 0.8)" : "rgba(200, 220, 255, 0.6)"}
                stroke={isDay ? "rgba(255, 200, 80, 0.5)" : "rgba(150, 180, 255, 0.4)"}
                strokeWidth="1.5"
                style={{ 
                  filter: isDay ? "drop-shadow(0 0 4px rgba(255, 200, 100, 0.6))" : "drop-shadow(0 0 3px rgba(150, 180, 255, 0.4))",
                  transition: "all 0.5s ease"
                }}
              />
              {/* Sun rays for daytime */}
              {isDay && (
                <>
                  <line x1="-8" y1="0" x2="-10" y2="0" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="1.5" />
                  <line x1="8" y1="0" x2="10" y2="0" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="1.5" />
                  <line x1="0" y1="-8" x2="0" y2="-10" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="1.5" />
                  <line x1="0" y1="8" x2="0" y2="10" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="1.5" />
                  <line x1="-5.7" y1="-5.7" x2="-7" y2="-7" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="1.5" />
                  <line x1="5.7" y1="5.7" x2="7" y2="7" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="1.5" />
                  <line x1="5.7" y1="-5.7" x2="7" y2="-7" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="1.5" />
                  <line x1="-5.7" y1="5.7" x2="-7" y2="7" stroke="rgba(255, 220, 100, 0.6)" strokeWidth="1.5" />
                </>
              )}
            </g>
          </svg>
        </div>
        
        {/* Content container */}
        <div className="relative h-full flex flex-col justify-between px-6 py-4 z-10">
          {/* Top row: Sunrise and Sunset times */}
          <div className="flex items-center justify-between">
            {/* Sunrise - Left side */}
            <div className="flex flex-col items-start">
              <div className="text-[11px] text-white/75 mb-1.5 font-medium flex items-center gap-1">
                <span>🌅</span>
                <span>{t("sunrise")}</span>
              </div>
              <div className="text-xl font-semibold text-white tracking-wide">
                {sunriseTime}
              </div>
            </div>
            
            {/* Sunset - Right side */}
            <div className="flex flex-col items-end">
              <div className="text-[11px] text-white/75 mb-1.5 font-medium flex items-center gap-1">
                <span>{t("sunset")}</span>
                <span>🌇</span>
              </div>
              <div className="text-xl font-semibold text-white tracking-wide">
                {sunsetTime}
              </div>
            </div>
          </div>
          
          {/* Bottom row: Day length */}
          {dayLengthText && (
            <div className="flex items-center justify-center mt-2">
              <p className="text-[10px] text-white/70 font-medium">
                {dayLengthText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
