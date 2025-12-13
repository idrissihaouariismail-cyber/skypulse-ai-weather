// src/components/SunriseSunsetCard.tsx
import React from "react";
import { useLanguage } from "../src/context/LanguageContext";

interface Props {
  sunrise?: string;
  sunset?: string;
}

/**
 * Format time string to 24-hour format with Western numbers
 * Input: "06:41 AM" or "18:22" or "6:41 PM" or any time string
 * Output: "06:41" or "18:22" (24-hour format, Western digits)
 */
function formatTime24Hour(timeStr: string | undefined, language: string): string {
  if (!timeStr) return "—";
  
  try {
    // Extract hours and minutes from the time string
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
      // Try to parse as Date if no match
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) {
        return "—";
      }
      // Format from Date object
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
    
    // Format as HH:MM with leading zeros, always Western digits
    const hourStr = hour24.toString().padStart(2, "0");
    const minuteStr = minutes.toString().padStart(2, "0");
    
    return `${hourStr}:${minuteStr}`;
  } catch {
    return "—";
  }
}

export default function SunriseSunsetCard({ sunrise, sunset }: Props) {
  const { t, language } = useLanguage();
  
  const sunriseTime = formatTime24Hour(sunrise, language);
  const sunsetTime = formatTime24Hour(sunset, language);
  
  return (
    <div className="mt-6 px-4">
      <div className="relative bg-white/15 backdrop-blur-md border border-white/30 rounded-t-[3rem] rounded-b-none overflow-hidden shadow-lg" style={{ height: "110px" }}>
        {/* Semi-circle arc background - sun path */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="absolute top-6 w-full h-20"
            viewBox="0 0 200 60"
            preserveAspectRatio="none"
            style={{ overflow: "visible" }}
          >
            {/* Sun path arc - elegant curved line */}
            <path
              d="M 25 50 Q 100 8, 175 50"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Sun icon in the middle of the arc */}
            <circle
              cx="100"
              cy="20"
              r="5"
              fill="rgba(255, 255, 255, 0.4)"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
          </svg>
        </div>
        
        {/* Content container */}
        <div className="relative h-full flex items-center justify-between px-6 py-5 z-10">
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
      </div>
    </div>
  );
}

