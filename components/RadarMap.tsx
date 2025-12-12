// src/components/RadarMap.tsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import CloseButton from "./CloseButton";
import { getCoordinates } from "../services/weather";
import { useLanguage } from "../src/context/LanguageContext";

interface Props {
  location: string;
  onClose: () => void;
}

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to handle map updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

// Component to get map instance and store it in ref
function MapInstance({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  return null;
}

// Component to handle location updates from coordinates
function MapController({ coordinates }: { coordinates: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates) {
      map.setView(coordinates, map.getZoom());
    }
  }, [coordinates, map]);
  
  return null;
}

/**
 * WeatherLayerManager - OpenWeatherMap tile layers only
 * 
 * All weather layers use OpenWeatherMap tiles:
 * - Radar/Precipitation: precipitation_new
 * - Clouds: clouds_new
 * - Wind: wind_new
 * - Temperature: temp_new
 */
function WeatherLayerManager({ 
  layerType,
  tileVersion,
}: { 
  layerType: string;
  tileVersion: number;
}) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    const paneName = "weatherPane";
    if (!map.getPane(paneName)) {
      map.createPane(paneName);
    }
    const weatherPane = map.getPane(paneName);
    if (weatherPane) {
      weatherPane.style.zIndex = "900";
      weatherPane.style.pointerEvents = "none";
    }

    // Remove old layer before adding new one
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    /**
     * OpenWeatherMap tile URLs for all weather layers
     */
    const getOWMPrecipUrl = () =>
      `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`;
    
    const getOWMCloudsUrl = () =>
      `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`;
    
    const getOWMWindUrl = () =>
      `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`;
    
    const getOWMTempUrl = () =>
      `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`;

    /**
     * Add tile layer with smooth fade-in animation
     * Configured for optimal visibility at all zoom levels (2-12)
     */
    const addLayerWithFade = (url: string, attribution: string) => {
      console.log("Adding weather layer", { layerType, url });
      
      const newLayer = L.tileLayer(url, {
        attribution,
        pane: paneName,
        opacity: 0,
        zIndex: 900,
        maxZoom: 12,
        minZoom: 2,
        tileSize: 256,
        detectRetina: true,
        updateWhenZooming: true,
        updateWhenIdle: true,
      });

      newLayer.on("tileerror", (error) => {
        console.warn("Tile load error:", url, error);
      });

      newLayer.addTo(map);
      layerRef.current = newLayer;

      // Smooth fade-in animation (0 → target opacity in ~200ms)
      let opacity = 0;
      const targetOpacity = layerType === "radar" ? 0.85 : 0.9;
      const fadeInterval = setInterval(() => {
        opacity += 0.15;
        if (opacity >= targetOpacity) {
          opacity = targetOpacity;
          clearInterval(fadeInterval);
        }
        newLayer.setOpacity(opacity);
      }, 30);
    };

    /**
     * Load appropriate layer based on selectedLayer type
     * All layers use OpenWeatherMap tiles
     */
    const loadLayer = () => {
      if (layerType === "radar" || layerType === "precipitation") {
        addLayerWithFade(getOWMPrecipUrl(), "OpenWeatherMap");
        return;
      }

      if (layerType === "clouds") {
        addLayerWithFade(getOWMCloudsUrl(), "OpenWeatherMap");
        return;
      }

      if (layerType === "wind") {
        addLayerWithFade(getOWMWindUrl(), "OpenWeatherMap");
        return;
      }

      if (layerType === "temperature") {
        addLayerWithFade(getOWMTempUrl(), "OpenWeatherMap");
        return;
      }

      // Default fallback
      addLayerWithFade(getOWMPrecipUrl(), "OpenWeatherMap");
    };

    loadLayer();

    // Cleanup: remove layer on unmount or dependency change
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, layerType, tileVersion]);

  return null;
}

export default function RadarMap({ location, onClose }: Props) {
  const { t } = useLanguage();
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default: San Francisco
  const [zoom, setZoom] = useState(9);
  const [searchInput, setSearchInput] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>("radar");
  const [tileVersion, setTileVersion] = useState<number>(0);
  const [legendOpacity, setLegendOpacity] = useState<number>(1);
  // UI state for play/pause buttons (kept for UI consistency, no animation functionality)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(600);
  const [speedLabel, setSpeedLabel] = useState<string | null>(null);
  const speedLabelTimer = useRef<NodeJS.Timeout | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Convert location string to coordinates (handles both "lat,lon" and city names)
  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!location) return;

      // Initialize search input with location if empty
      if (!searchInput) {
        setSearchInput(location);
      }

      // Check if location is already coordinates (lat,lon format)
      const latLonMatch = location.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
      if (latLonMatch) {
        const lat = parseFloat(latLonMatch[1]);
        const lon = parseFloat(latLonMatch[3]);
        if (!isNaN(lat) && !isNaN(lon)) {
          const coords: [number, number] = [lat, lon];
          setMapCenter(coords);
          setCoordinates(coords);
          return;
        }
      }

      // Otherwise, treat as city name and geocode it
      try {
        const coords = await getCoordinates(location);
        if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
          const newCoords: [number, number] = [coords.lat, coords.lon];
          setMapCenter(newCoords);
          setCoordinates(newCoords);
          // Update search input with the found location name if it's a city name
          if (coords.name && !latLonMatch) {
            setSearchInput(coords.name);
          }
        }
      } catch (error) {
        console.error("Error fetching coordinates:", error);
      }
    };

    fetchCoordinates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
      setZoom(mapInstanceRef.current.getZoom());
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
      setZoom(mapInstanceRef.current.getZoom());
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    try {
      const coords = await getCoordinates(searchInput.trim());
      if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
        const newCoords: [number, number] = [coords.lat, coords.lon];
        setMapCenter(newCoords);
        setCoordinates(newCoords);
        const targetZoom = selectedLayer === "radar" ? 10 : 9;
        setZoom(targetZoom);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(newCoords, targetZoom);
        }
      } else {
        console.warn("Location not found:", searchInput);
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter: [number, number] = [position.coords.latitude, position.coords.longitude];
          setMapCenter(newCenter);
          setCoordinates(newCenter);
          const targetZoom = selectedLayer === "radar" ? 10 : 9;
          setZoom(targetZoom);
          mapInstanceRef.current?.setView(newCenter, targetZoom);
        },
        () => {
          console.warn("Geolocation denied");
        }
      );
    }
  };

  const handleLayerChange = (layerType: string) => {
    setLegendOpacity(0);
    setTimeout(() => {
      setSelectedLayer(layerType);
      setLegendOpacity(1);
      setTileVersion((v) => v + 1);
    }, 150);
  };

  const handleRefresh = () => {
    setTileVersion((v) => v + 1);
  };

  // Stub handlers for play/pause and speed buttons (UI kept, no animation functionality)
  const handleSpeedCycle = () => {
    const speeds = [
      { label: "1x", value: 600 },
      { label: "2x", value: 350 },
      { label: "4x", value: 150 },
    ];
    const currentIndex = speeds.findIndex((s) => s.value === animationSpeed);
    const next = speeds[(currentIndex + 1) % speeds.length];
    setAnimationSpeed(next.value);
    setSpeedLabel(`Speed: ${next.label}`);
    if (speedLabelTimer.current) clearTimeout(speedLabelTimer.current);
    speedLabelTimer.current = setTimeout(() => setSpeedLabel(null), 1500);
  };

  // Cleanup speed label timer
  useEffect(() => {
    return () => {
      if (speedLabelTimer.current) clearTimeout(speedLabelTimer.current);
    };
  }, []);

  // Legend configuration based on selected layer
  const getLegendConfig = () => {
    switch (selectedLayer) {
      case "radar":
        return {
          gradient: "linear-gradient(to right, #00A8FF, #0050FF, #7800FF, #C800FF, #FF0000)",
          labels: ["Light", "Moderate", "Heavy", "Intense", "Extreme"],
        };
      case "clouds":
        return {
          gradient: "linear-gradient(to right, #888, #BBB, #EEE, #FFF)",
          labels: ["Low", "Medium", "Thick", "Dense"],
        };
      case "wind":
        return {
          gradient: "linear-gradient(to right, #00FFAA, #00CC88, #008866, #004433)",
          labels: ["Breeze", "Moderate", "Strong", "Severe"],
        };
      case "temperature":
        return {
          gradient: "linear-gradient(to right, #0000FF, #00FFFF, #00FF00, #FFFF00, #FF0000)",
          labels: ["Cold", "Cool", "Mild", "Warm", "Hot"],
        };
      default:
        return {
          gradient: "linear-gradient(to right, #00A8FF, #0050FF, #7800FF, #C800FF, #FF0000)",
          labels: ["Light", "Moderate", "Heavy", "Intense", "Extreme"],
        };
    }
  };

  const legendConfig = getLegendConfig();

  return (
    <div className="relative pt-16 px-6 min-h-screen bg-sky-300 text-white overflow-hidden">
      <CloseButton onClose={onClose} />
      
      {/* Map container */}
      <div className="absolute inset-0 z-0" style={{ height: "100vh" }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Base map layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            opacity={0.5}
            zIndex={200}
          />
          
          {/* Dynamic weather layer - managed by WeatherLayerManager */}
          <WeatherLayerManager 
            layerType={selectedLayer}
            tileVersion={tileVersion}
          />
          
          <MapInstance mapRef={mapInstanceRef} />
          <MapUpdater center={mapCenter} zoom={zoom} />
          <MapController coordinates={coordinates} />
        </MapContainer>
      </div>

      {/* Search bar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl">
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-black/40 backdrop-blur-lg border border-white/20 shadow-2xl">
            <span className="text-white/90 text-xl">🔍</span>
            <input
              type="text"
              placeholder={t("search")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent placeholder-white/70 text-white text-base font-medium outline-none"
            />
            <button 
              type="submit" 
              className="px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition"
            >
              {t("search").replace("...", "")}
            </button>
          </div>
        </form>
      </div>

      {/* Zoom + Locate + Frame controls stack */}
      <div className="absolute top-1/2 -translate-y-1/2 right-6 z-40 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-3 bg-black/40 backdrop-blur-md rounded-full px-2 py-3 shadow-lg border border-white/10">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white text-2xl leading-none hover:bg-white/25 transition z-50"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white text-2xl leading-none hover:bg-white/25 transition z-50"
          >
            –
          </button>
        </div>
        <button
          onClick={handleLocate}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white text-xl shadow-lg border border-white/10 hover:bg-black/60 transition z-50"
        >
          📍
        </button>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md text-white text-lg leading-none hover:bg-black/60 transition border border-white/15 shadow-lg"
          aria-label="Play/Pause frames"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div className="relative">
          <button
            onClick={handleSpeedCycle}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md text-white text-lg leading-none hover:bg-black/60 transition border border-white/15 shadow-lg"
            aria-label="Change speed"
          >
            ⚡
          </button>
          {speedLabel && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-semibold shadow-lg transition-opacity duration-300">
              {speedLabel}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="absolute inset-x-6 bottom-32 z-30">
        <button className="w-full bg-cyan-500 text-black font-semibold text-lg rounded-full py-4 shadow-xl flex items-center justify-center gap-2 hover:bg-cyan-400 transition">
          <span>Explain this pattern</span>
          <span className="text-xl">🤖</span>
        </button>
      </div>

      {/* Radar Legend */}
      <style>
        {`
          .radar-legend {
            position: absolute !important;
            top: 150px !important;
            left: 24px !important;
            z-index: 900 !important;
            width: 36px !important;
            height: 360px !important;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .radar-legend .bar {
            width: 100% !important;
            height: 100% !important;
            border-radius: 20px;
            background: linear-gradient(
              to bottom,
              #1e90ff,
              #00e5ff,
              #00ff87,
              #e3ff00,
              #ff9500,
              #ff3b30,
              #b100ff
            );
          }
          .radar-legend .label {
            position: absolute;
            left: 50px;
            font-size: 16px;
            font-weight: 600;
            color: white;
            letter-spacing: 0.4px;
            text-shadow: 0px 2px 4px rgba(0,0,0,0.9);
            transform: translateY(-45%);
          }
          .radar-legend .label-light { top: 3%; }
          .radar-legend .label-moderate { top: 22%; }
          .radar-legend .label-heavy { top: 48%; }
          .radar-legend .label-intense { top: 72%; }
          .radar-legend .label-extreme { top: 95%; }
        `}
      </style>
      <div className="radar-legend pointer-events-none">
        <div className="bar" />
        <span className="label label-light">Light</span>
        <span className="label label-moderate">Moderate</span>
        <span className="label label-heavy">Heavy</span>
        <span className="label label-intense">Intense</span>
        <span className="label label-extreme">Extreme</span>
      </div>

      {/* Bottom layer selector bar */}
      <div className="absolute inset-x-6 bottom-8 z-30">
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-lg border border-white/20 shadow-2xl">
          <button
            onClick={() => handleLayerChange("radar")}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${
              selectedLayer === "radar" 
                ? "bg-white/20 scale-105" 
                : "hover:bg-white/10"
            }`}
            title="Precipitation Radar"
          >
            <span className="text-2xl">🌧</span>
            <span className="text-[10px] font-medium text-white/90">Radar</span>
          </button>
          <button
            onClick={() => handleLayerChange("clouds")}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${
              selectedLayer === "clouds" 
                ? "bg-white/20 scale-105" 
                : "hover:bg-white/10"
            }`}
            title="Cloud Cover"
          >
            <span className="text-2xl">☁️</span>
            <span className="text-[10px] font-medium text-white/90">Clouds</span>
          </button>
          <button
            onClick={() => handleLayerChange("wind")}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${
              selectedLayer === "wind" 
                ? "bg-white/20 scale-105" 
                : "hover:bg-white/10"
            }`}
            title="Wind Speeds"
          >
            <span className="text-2xl">💨</span>
            <span className="text-[10px] font-medium text-white/90">Wind</span>
          </button>
          <button
            onClick={() => handleLayerChange("temperature")}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition ${
              selectedLayer === "temperature" 
                ? "bg-white/20 scale-105" 
                : "hover:bg-white/10"
            }`}
            title="Temperature"
          >
            <span className="text-2xl">🌡️</span>
            <span className="text-[10px] font-medium text-white/90">Temp</span>
          </button>
          <button
            onClick={handleRefresh}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition hover:bg-white/10`}
            title="Refresh Radar"
          >
            <span className="text-2xl">🔄</span>
            <span className="text-[10px] font-medium text-white/90">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
