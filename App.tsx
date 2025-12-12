// src/App.tsx
import React, { useCallback, useEffect, useState } from "react";
import { Settings, TemperatureUnit, WeatherData } from "./types";
import { getComposedWeather } from "./services/composeWeather";
import Dashboard from "./components/Dashboard";
import Forecast from "./components/Forecast";
import AirQuality from "./components/AirQuality";
import RadarMap from "./components/RadarMap";
import SettingsScreen from "./components/SettingsScreen";
import AboutApp from "./components/AboutApp";
import PrivacyPolicy from "./components/PrivacyPolicy";
import { NAV_VIEWS, DEFAULT_LOCATION } from "./constants";
import { getUserLocation } from "./src/utils/location";
// Removed import { detectDeviceLanguage, DEFAULT_LOCALE, VIEWS } from "./utils/language";
// We'll redefine detectDeviceLanguage and DEFAULT_LOCALE locally due to missing module.

const DEFAULT_LOCALE = "en";
const VIEWS = ["DASHBOARD", "FORECAST", "AIR_QUALITY", "RADAR", "SETTINGS"];

function detectDeviceLanguage(): string {
  if (navigator.languages && navigator.languages.length > 0) {
    return navigator.languages[0].split("-")[0];
  }
  if (navigator.language) {
    return navigator.language.split("-")[0];
  }
  return DEFAULT_LOCALE;
}

const SETTINGS_STORAGE_KEY = "skypulse_settings";

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<string>(DEFAULT_LOCATION);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          unit: parsed.unit || TemperatureUnit.CELSIUS,
          theme: parsed.theme || "dark",
          // If language is saved, use it; otherwise default to "auto" for auto-detection
          language: parsed.language || "auto",
          savedLocations: parsed.savedLocations || [DEFAULT_LOCATION],
        };
      }
    } catch (err) {
      console.warn("Failed to load settings from localStorage:", err);
    }
    
    // Default settings with "auto" language (uses device detection)
    return {
      unit: TemperatureUnit.CELSIUS,
      theme: "dark",
      language: "auto", // Use auto-detection by default
      savedLocations: [DEFAULT_LOCATION],
    };
  });

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);
  const [detectingLocation, setDetectingLocation] = useState<boolean>(true);

  const [activeView, setActiveView] = useState<typeof NAV_VIEWS[0]>(NAV_VIEWS[0]);

  // Detect device language on app startup
  useEffect(() => {
    const detected = detectDeviceLanguage();
    setDetectedLanguage(detected);
  }, []);

  // Save settings to localStorage when they change (but only manual language choices, not "auto")
  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    
    // Save to localStorage, but only if language is manually set (not "auto")
    try {
      const toSave: Partial<Settings> = {
        unit: newSettings.unit,
        theme: newSettings.theme,
        savedLocations: newSettings.savedLocations,
      };
      
      // Only save language if it's a manual choice (not "auto")
      if (newSettings.language !== "auto") {
        toSave.language = newSettings.language;
      }
      
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.warn("Failed to save settings to localStorage:", err);
    }
  }, []);

  // Auto-detect location on first load
  useEffect(() => {
    let mounted = true;
    
    const initializeLocation = async () => {
      setDetectingLocation(true);
      const userLocation = await getUserLocation();
      
      if (!mounted) return;
      
      setDetectingLocation(false);
      
      if (userLocation) {
        // Use coordinates directly
        setCurrentLocation(`${userLocation.lat},${userLocation.lon}`);
        setLocationDenied(false);
      } else {
        // Fallback to default location
        setLocationDenied(true);
        setCurrentLocation(DEFAULT_LOCATION);
      }
    };
    
    initializeLocation();
    
    return () => {
      mounted = false;
    };
  }, []);

  const fetchWeather = useCallback(async (loc: string | { lat: number; lon: number }, unit: TemperatureUnit) => {
    setLoading(true);
    setError(null);
    try {
      // If loc is a coordinate string, convert to object
      let locationParam: string | { lat: number; lon: number };
      if (typeof loc === "string" && loc.includes(",")) {
        const [lat, lon] = loc.split(",").map(Number);
        if (!isNaN(lat) && !isNaN(lon)) {
          locationParam = { lat, lon };
        } else {
          locationParam = loc;
        }
      } else {
        locationParam = loc;
      }
      
      const data = await getComposedWeather(locationParam, unit);
      setWeatherData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchWeather(currentLocation, settings.unit);
    }
  }, [currentLocation, settings.unit, fetchWeather]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    setCurrentLocation(query.trim());
    setActiveView(NAV_VIEWS[0]);
  };

  const handleGoTo = (view: { id: string; name: string }) => {
    const navView = NAV_VIEWS.find(v => v.id === view.id) || NAV_VIEWS[0];
    setActiveView(navView);
  };

  const renderContent = () => {
    // Show location detection message
    if (detectingLocation) {
      const lang = settings.language === "auto" ? detectedLanguage : settings.language;
      const messages: Record<string, string> = {
        en: "Detecting your location…",
        fr: "Détection de votre position…",
        ar: "جاري تحديد موقعك...",
      };
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-screen bg-black text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <div className="text-lg">{messages[lang] || messages.en}</div>
        </div>
      );
    }
    
    if (loading && !weatherData) {
      return (
        <div className="flex items-center justify-center h-full min-h-screen bg-black text-white">
          <div>Loading...</div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center justify-center h-full min-h-screen bg-black text-white">
          <div className="text-red-400">{error}</div>
        </div>
      );
    }
    if (!weatherData || !weatherData.current) {
      return (
        <div className="flex items-center justify-center h-full min-h-screen bg-black text-white">
          <div>No weather data available.</div>
        </div>
      );
    }

    switch (activeView.id) {
      case "dashboard":
        return (
          <>
            {locationDenied && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md">
                <div className="bg-amber-500/90 backdrop-blur-md rounded-lg px-4 py-3 text-white text-sm text-center shadow-lg">
                  {(() => {
                    const lang = settings.language === "auto" ? detectedLanguage : settings.language;
                    const messages: Record<string, string> = {
                      en: "Unable to detect your location, please use search.",
                      fr: "Impossible de détecter votre position, veuillez utiliser la recherche.",
                      ar: "تعذر تحديد موقعك، الرجاء استخدام البحث.",
                    };
                    return messages[lang] || messages.en;
                  })()}
                </div>
              </div>
            )}
            <Dashboard
              weatherData={weatherData}
              settings={settings}
              goTo={setActiveView}
              onSearch={handleSearch}
            />
          </>
        );
      case "forecast":
        return (
          <Forecast
            forecast={weatherData.forecast || []}
            unit={settings.unit}
            onClose={() => setActiveView(NAV_VIEWS[0])}
          />
        );
      case "air_quality":
        return (
          <AirQuality
            airQuality={weatherData.airQuality}
            onClose={() => setActiveView(NAV_VIEWS[0])}
          />
        );
      case "radar":
        return (
          <RadarMap
            location={weatherData.current.location || DEFAULT_LOCATION}
            onClose={() => setActiveView(NAV_VIEWS[0])}
          />
        );
      case "settings":
        return (
          <SettingsScreen
            weatherData={weatherData}
            settings={settings}
            setSettings={updateSettings}
            detectedLanguage={detectedLanguage}
            onClose={() => setActiveView(NAV_VIEWS[0])}
            goTo={handleGoTo}
          />
        );
      case "about_app":
        return (
          <AboutApp
            onClose={() => setActiveView(NAV_VIEWS.find(v => v.id === "settings") || NAV_VIEWS[0])}
          />
        );
      case "privacy_policy":
        return (
          <PrivacyPolicy
            onClose={() => setActiveView(NAV_VIEWS.find(v => v.id === "settings") || NAV_VIEWS[0])}
          />
        );
      default:
        return <Dashboard weatherData={weatherData} settings={settings} goTo={setActiveView} onSearch={handleSearch} />;
    }
  };

  try {
    return (
      <div className="min-h-screen bg-woodsmoke text-white font-sans">
        {/* Main content */}
        <main className="max-w-md mx-auto h-screen overflow-auto">
          {renderContent()}
        </main>
      </div>
    );
  } catch (err) {
    console.error("App render error:", err);
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-red-400">
          <div className="text-xl font-bold mb-2">App Error</div>
          <div className="text-sm">{String(err)}</div>
        </div>
      </div>
    );
  }
}