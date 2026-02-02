// src/App.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, TemperatureUnit } from "./types";
import Dashboard from "./components/Dashboard";
import RadarRedirectView from "./components/RadarRedirectView";
import SettingsScreen from "./components/SettingsScreen";
import AboutApp from "./components/AboutApp";
import PrivacyPolicy from "./components/PrivacyPolicy";
import { NAV_VIEWS, DEFAULT_LOCATION } from "./constants";
import { useLanguage } from "./src/context/LanguageContext";
import { useUserLocation } from "./src/hooks/useUserLocation";
import { WeatherProvider, useWeather } from "./src/context/WeatherContext";
import { getRadarOpenExternally, getRadarUrl } from "./services/radarRedirect";

const DEFAULT_LOCALE = "en";

function detectDeviceLanguage(): string {
  if (navigator.languages && navigator.languages.length > 0) {
    return navigator.languages[0].split("-")[0];
  }
  if (navigator.language) {
    return navigator.language.split("-")[0];
  }
  return DEFAULT_LOCALE;
}

/** Fallback coordinates when location is denied (San Francisco) so weather still loads */
const FALLBACK_COORDS = { lat: 37.7749, lon: -122.4194 };

const SETTINGS_STORAGE_KEY = "skypulse_settings";

/** Inner content that consumes WeatherContext (must be inside WeatherProvider). */
function AppContent(props: {
  settings: Settings;
  updateSettings: (s: Settings) => void;
  activeView: typeof NAV_VIEWS[0];
  setActiveView: (v: typeof NAV_VIEWS[0]) => void;
  handleSearch: (query: string) => void;
  handleCitySelect: (city: { lat: number; lon: number; name?: string; country?: string }) => void;
  selectedCity: { name?: string; country?: string; lat: number; lon: number } | null;
  showLocationButton: boolean;
  showLocationHelper: boolean;
  onRequestLocation: () => void;
  onRequestRadar: () => void;
  handleGoTo: (view: { id: string; name: string }) => void;
  detectedLanguage: string;
  defaultLocation: string;
  /** Coordinates for radar redirect (same as WeatherProvider) */
  lat: number;
  lon: number;
}) {
  const {
    settings,
    updateSettings,
    activeView,
    setActiveView,
    handleSearch,
    handleCitySelect,
    selectedCity,
    showLocationButton,
    showLocationHelper,
    onRequestLocation,
    onRequestRadar,
    handleGoTo,
    detectedLanguage,
    defaultLocation,
    lat,
    lon,
  } = props;
  const { weather, loading, error } = useWeather();

  if (loading && !weather) {
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
  if (!weather?.current) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-black text-white">
        <div>No weather data available.</div>
      </div>
    );
  }

  switch (activeView.id) {
    case "dashboard":
      return (
        <Dashboard
          settings={settings}
          goTo={setActiveView}
          onSearch={handleSearch}
          onCitySelect={handleCitySelect}
          selectedCity={selectedCity}
          showLocationButton={showLocationButton}
          showLocationHelper={showLocationHelper}
          onRequestLocation={onRequestLocation}
          onRequestRadar={onRequestRadar}
        />
      );
    case "radar":
      return (
        <RadarRedirectView
          lat={lat}
          lon={lon}
          onClose={() => setActiveView(NAV_VIEWS[0])}
        />
      );
    case "settings":
      return (
        <SettingsScreen
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
          onClose={() => setActiveView(NAV_VIEWS.find((v) => v.id === "settings") || NAV_VIEWS[0])}
        />
      );
    case "privacy_policy":
      return (
        <PrivacyPolicy
          onClose={() => setActiveView(NAV_VIEWS.find((v) => v.id === "settings") || NAV_VIEWS[0])}
        />
      );
    default:
      return (
        <Dashboard
          settings={settings}
          goTo={setActiveView}
          onSearch={handleSearch}
          onCitySelect={handleCitySelect}
          selectedCity={selectedCity}
          showLocationButton={showLocationButton}
          showLocationHelper={showLocationHelper}
          onRequestLocation={onRequestLocation}
          onRequestRadar={onRequestRadar}
        />
      );
  }
}

export default function App() {
  const { t } = useLanguage();
  const { status: locationStatus, city: detectedCity, requestLocation } = useUserLocation({ requestOnMount: true });

  const [currentLocation, setCurrentLocation] = useState<string | { lat: number; lon: number }>(DEFAULT_LOCATION);
  const [selectedCity, setSelectedCity] = useState<{ name?: string; country?: string; lat: number; lon: number } | null>(null);
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

  const [showLocationButton, setShowLocationButton] = useState<boolean>(false);
  const [showLocationHelper, setShowLocationHelper] = useState<boolean>(false);

  const detectingLocation = locationStatus === "detecting";

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

  // Sync useUserLocation result to app state: selected city, fallback coords, and helper visibility
  useEffect(() => {
    if (locationStatus === "granted" && detectedCity) {
      setSelectedCity(detectedCity);
      setShowLocationButton(false);
      setShowLocationHelper(false);
    } else if (locationStatus === "denied" || locationStatus === "error") {
      setShowLocationButton(true);
      setShowLocationHelper(true);
      setCurrentLocation(FALLBACK_COORDS);
    }
  }, [locationStatus, detectedCity]);

  // Handle "Use my location" button click - uses hook's requestLocation (permission + reverse geocode)
  const handleRequestLocation = useCallback(() => {
    setShowLocationHelper(false);
    requestLocation();
  }, [requestLocation]);

  // Coordinates for WeatherProvider (single source of truth)
  const { lat, lon } = useMemo(() => {
    if (selectedCity && typeof selectedCity.lat === "number" && typeof selectedCity.lon === "number") {
      return { lat: selectedCity.lat, lon: selectedCity.lon };
    }
    if (currentLocation) {
      if (typeof currentLocation === "string" && currentLocation.includes(",")) {
        const [latStr, lonStr] = currentLocation.split(",").map(s => s.trim());
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
      } else if (typeof currentLocation === "object" && "lat" in currentLocation && "lon" in currentLocation) {
        const lat = currentLocation.lat;
        const lon = currentLocation.lon;
        if (typeof lat === "number" && typeof lon === "number") return { lat, lon };
      }
    }
    return { lat: FALLBACK_COORDS.lat, lon: FALLBACK_COORDS.lon };
  }, [selectedCity, currentLocation]);

  const locationLabel = selectedCity?.name
    ? (selectedCity.country ? `${selectedCity.name}, ${selectedCity.country}` : selectedCity.name)
    : null;

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setCurrentLocation(query.trim());
    setActiveView(NAV_VIEWS[0]);
  }, []);

  const handleCitySelect = useCallback((city: { lat: number; lon: number; name?: string; country?: string }) => {
    // State 3: selectedCity - stores full city object
    // This triggers weather fetch via useEffect
    setSelectedCity(city);
    setActiveView(NAV_VIEWS[0]);
  }, []);

  const handleGoTo = (view: { id: string; name: string }) => {
    const navView = NAV_VIEWS.find(v => v.id === view.id) || NAV_VIEWS[0];
    setActiveView(navView);
  };

  /** Open Radar: if preference "open externally", open in new tab; else show in-app WebView. */
  const handleRequestRadar = useCallback(() => {
    if (getRadarOpenExternally()) {
      window.open(getRadarUrl(lat, lon), "_blank", "noopener,noreferrer");
      return;
    }
    setActiveView(NAV_VIEWS.find(v => v.id === "radar") || NAV_VIEWS[0]);
  }, [lat, lon]);

  const renderContent = () => {
    if (detectingLocation) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-screen bg-black text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" aria-hidden />
          <div className="text-lg">{t("location.detecting")}</div>
        </div>
      );
    }
    return (
      <WeatherProvider lat={lat} lon={lon} unit={settings.unit} locationLabel={locationLabel}>
        <AppContent
          settings={settings}
          updateSettings={updateSettings}
          activeView={activeView}
          setActiveView={setActiveView}
          handleSearch={handleSearch}
          handleCitySelect={handleCitySelect}
          selectedCity={selectedCity}
          showLocationButton={showLocationButton}
          showLocationHelper={showLocationHelper}
          onRequestLocation={handleRequestLocation}
          onRequestRadar={handleRequestRadar}
          handleGoTo={handleGoTo}
          detectedLanguage={detectedLanguage}
          defaultLocation={DEFAULT_LOCATION}
          lat={lat}
          lon={lon}
        />
      </WeatherProvider>
    );
  };

  try {
    return (
      <div className="min-h-screen bg-woodsmoke text-white font-sans">
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