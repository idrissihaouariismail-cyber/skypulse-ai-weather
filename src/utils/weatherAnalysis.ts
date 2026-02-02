/**
 * Rule-Based Weather Analysis System
 * 
 * Fast, consistent, contradiction-free weather analysis for TODAY
 * 
 * Rules:
 * - Rule-based logic only (no AI text generation)
 * - TODAY weather only
 * - ONE dominant condition
 * - Early return (stops evaluation when condition found)
 * - No combining multiple conditions
 */

import { CurrentWeather } from "../types";

export interface WeatherAnalysis {
  title: string;
  summary: string;
  decision: string;
}

/**
 * Priority Order (highest to lowest):
 * 1. Rain / Storm
 * 2. Extreme heat (>= 35°C) or extreme cold (<= 5°C)
 * 3. Strong wind (>= 40 km/h)
 * 4. High humidity (>= 80%)
 * 5. Stable weather (default)
 */

/**
 * Rule-based weather analysis - returns ONE dominant condition
 * Stops evaluation as soon as dominant condition is found
 */
export function generateWeatherAnalysis(
  current: CurrentWeather,
  unit: "C" | "F"
): WeatherAnalysis {
  const temp = Math.round(current.temperature ?? 0);
  const condition = (current.condition || "").toLowerCase();
  const windSpeed = current.windSpeed ?? 0;
  const humidity = current.humidity ?? 0;

  // ============================================================================
  // PRIORITY 1: Rain / Storm (highest priority - check first)
  // ============================================================================
  
  if (condition.includes("thunder") || condition.includes("storm")) {
    return {
      title: "Thunderstorms Today",
      summary: "Thunderstorms with heavy rain and lightning are expected today. These conditions are dangerous.",
      decision: "Stay indoors today. Avoid all outdoor activities and driving."
    };
  }

  if (condition.includes("heavy") && (condition.includes("rain") || condition.includes("drizzle"))) {
    return {
      title: "Heavy Rain Today",
      summary: "Heavy rainfall will continue throughout today. This will cause flooding and dangerous road conditions.",
      decision: "Avoid all travel today. Stay indoors and away from flooded areas."
    };
  }

  if (condition.includes("snow")) {
    return {
      title: "Snow Today",
      summary: "Snow will fall and accumulate today. Road conditions will be slippery and dangerous.",
      decision: "Avoid driving today. Stay indoors and dress in warm waterproof layers."
    };
  }

  if (condition.includes("rain") || condition.includes("drizzle")) {
    return {
      title: "Rain Today",
      summary: "Rain will continue throughout today. Outdoor activities will be uncomfortable.",
      decision: "Carry an umbrella and wear waterproof clothing today. Plan indoor activities."
    };
  }

  // ============================================================================
  // PRIORITY 2: Extreme Temperatures (second priority)
  // ============================================================================
  
  // Extreme heat: >= 35°C or >= 95°F
  if ((unit === "C" && temp >= 35) || (unit === "F" && temp >= 95)) {
    return {
      title: "Extreme Heat Today",
      summary: `Temperatures will reach ${temp}°${unit} today. These conditions are dangerous.`,
      decision: "Stay indoors during peak hours (2-5 PM) today. Drink water every 30 minutes."
    };
  }

  // Extreme cold: <= 5°C or <= 41°F (5°C = 41°F)
  if ((unit === "C" && temp <= 5) || (unit === "F" && temp <= 41)) {
    return {
      title: "Extreme Cold Today",
      summary: `Temperatures will drop to ${temp}°${unit} today. These conditions pose health risks.`,
      decision: "Dress in multiple warm layers covering all exposed skin today. Limit outdoor time to 10 minutes."
    };
  }

  // ============================================================================
  // PRIORITY 3: Strong Wind (third priority)
  // ============================================================================
  
  // Strong wind: >= 40 km/h
  if (windSpeed >= 40) {
    return {
      title: "Strong Winds Today",
      summary: `Winds will reach ${Math.round(windSpeed)} km/h today. These winds make outdoor activities dangerous.`,
      decision: "Secure outdoor items immediately. Avoid driving on highways today. Stay away from trees."
    };
  }

  // ============================================================================
  // PRIORITY 4: High Humidity (fourth priority)
  // ============================================================================
  
  // High humidity: >= 80%
  if (humidity >= 80) {
    return {
      title: "High Humidity Today",
      summary: `Humidity levels are ${humidity}% today. This makes the air feel heavy and uncomfortable.`,
      decision: "Stay in air-conditioned spaces today. Drink extra water and avoid strenuous outdoor activities."
    };
  }

  // ============================================================================
  // PRIORITY 5: Stable Weather (lowest priority - default)
  // ============================================================================
  
  if (condition.includes("clear") || condition.includes("sunny")) {
    return {
      title: "Clear Weather Today",
      summary: `Sunny skies with temperatures around ${temp}°${unit} today. Conditions are ideal for activities.`,
      decision: "Excellent day for outdoor plans today. Perfect weather for walks and outdoor activities."
    };
  }

  if (condition.includes("cloud")) {
    return {
      title: "Cloudy Today",
      summary: `Overcast conditions with temperatures around ${temp}°${unit} today. No precipitation expected.`,
      decision: "Normal activities can continue today. The clouds provide comfortable conditions for outdoor activities."
    };
  }

  // Default fallback (stable conditions)
  return {
    title: "Stable Weather Today",
    summary: `Weather conditions are stable with temperatures around ${temp}°${unit} today. No significant changes expected.`,
    decision: "Normal activities can continue today as planned."
  };
}

/**
 * Format analysis for display
 */
export function formatAnalysis(analysis: WeatherAnalysis): string {
  return `${analysis.title}\n\n${analysis.summary}\n\n${analysis.decision}`;
}
