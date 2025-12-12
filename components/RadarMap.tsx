// src/components/RadarMap.tsx
import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker } from "react-leaflet";
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

// Default view constants
const DEFAULT_CENTER: [number, number] = [30, 0]; // North Africa + Europe view
const DEFAULT_ZOOM = 4;
const MIN_ZOOM = 2;
const MAX_ZOOM = 12;

// Component to get map instance and store it in ref
function MapInstance({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  return null;
}

// Component to handle location marker (centers marker but keeps zoom at 4)
function LocationMarker({ coordinates }: { coordinates: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && map) {
      // Center the map on coordinates but keep zoom at 4
      map.setView(coordinates, DEFAULT_ZOOM, {
        animate: true,
        duration: 0.15,
      });
    }
  }, [coordinates, map]);
  
  if (!coordinates) return null;
  
  return <Marker position={coordinates} />;
}

/**
 * WeatherLayerManager - OpenWeatherMap tile layers
 * Opacity: 0.65 for all layers
 * Smooth transitions max 150ms
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
     * Add tile layer with opacity 0.65 and smooth transition
     */
    const addLayer = (url: string, attribution: string) => {
      const newLayer = L.tileLayer(url, {
        attribution,
        pane: paneName,
        opacity: 0.65,
        zIndex: 900,
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
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
    };

    /**
     * Load appropriate layer based on selectedLayer type
     */
    const loadLayer = () => {
      if (layerType === "radar" || layerType === "precipitation") {
        addLayer(getOWMPrecipUrl(), "OpenWeatherMap");
        return;
      }

      if (layerType === "clouds") {
        addLayer(getOWMCloudsUrl(), "OpenWeatherMap");
        return;
      }

      if (layerType === "wind") {
        addLayer(getOWMWindUrl(), "OpenWeatherMap");
        return;
      }

      if (layerType === "temperature") {
        addLayer(getOWMTempUrl(), "OpenWeatherMap");
        return;
      }

      // Default fallback
      addLayer(getOWMPrecipUrl(), "OpenWeatherMap");
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
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [searchInput, setSearchInput] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>("radar");
  const [tileVersion, setTileVersion] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
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
          setCoordinates(coords);
          setMapCenter(coords);
          // Keep zoom at 4, only center changes
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(coords, DEFAULT_ZOOM, {
              animate: true,
              duration: 0.15,
            });
          }
          return;
        }
      }

      // Otherwise, treat as city name and geocode it
      try {
        const coords = await getCoordinates(location);
        if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
          const newCoords: [number, number] = [coords.lat, coords.lon];
          setCoordinates(newCoords);
          setMapCenter(newCoords);
          // Keep zoom at 4, only center changes
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(newCoords, DEFAULT_ZOOM, {
              animate: true,
              duration: 0.15,
            });
          }
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

  // Reset view button - fitBounds to Europe + North Africa
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      // Fit bounds: [[60, -30], [10, 40]]
      const bounds: L.LatLngBoundsExpression = [[10, -30], [60, 40]];
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: MAX_ZOOM,
        animate: true,
        duration: 0.15,
      });
      const newZoom = mapInstanceRef.current.getZoom();
      setZoom(newZoom);
      const newCenter = mapInstanceRef.current.getCenter();
      if (newCenter) {
        setMapCenter([newCenter.lat, newCenter.lng]);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    try {
      const coords = await getCoordinates(searchInput.trim());
      if (coords && !isNaN(coords.lat) && !isNaN(coords.lon)) {
        const newCoords: [number, number] = [coords.lat, coords.lon];
        setCoordinates(newCoords);
        setMapCenter(newCoords);
        // Keep zoom at 4
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(newCoords, DEFAULT_ZOOM, {
            animate: true,
            duration: 0.15,
          });
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
          setCoordinates(newCenter);
          setMapCenter(newCenter);
          // Keep zoom at 4, only center changes
          mapInstanceRef.current?.setView(newCenter, DEFAULT_ZOOM, {
            animate: true,
            duration: 0.15,
          });
        },
        () => {
          console.warn("Geolocation denied");
        }
      );
    }
  };

  const handleLayerChange = (layerType: string) => {
    setSelectedLayer(layerType);
    setTileVersion((v) => v + 1);
  };

  const handleRefresh = () => {
    setTileVersion((v) => v + 1);
  };

  return (
    <div className="relative pt-16 px-4 min-h-screen bg-sky-300 text-white overflow-hidden">
      <CloseButton onClose={onClose} />
      
      {/* Map container */}
      <div className="absolute inset-0 z-0" style={{ height: "100vh" }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          zoomControl={false}
          attributionControl={false}
          fadeAnimation={true}
          zoomAnimation={true}
          zoomAnimationThreshold={4}
          markerZoomAnimation={false}
        >
          {/* Base map layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            opacity={0.5}
            zIndex={200}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
          />
          
          {/* Dynamic weather layer */}
          <WeatherLayerManager 
            layerType={selectedLayer}
            tileVersion={tileVersion}
          />
          
          {/* Location marker */}
          <LocationMarker coordinates={coordinates} />
          
          <MapInstance mapRef={mapInstanceRef} />
        </MapContainer>
      </div>

      {/* Search bar - aligned to the right of close button, same vertical level */}
      <div className="absolute top-4 left-[72px] right-4 z-30" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-lg border border-white/20 shadow-xl">
            <span className="text-white/90 text-sm">🔍</span>
            <input
              type="text"
              placeholder={t("search")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 bg-transparent placeholder-white/70 text-white text-xs font-medium outline-none"
            />
            <button 
              type="submit" 
              className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold transition"
            >
              {t("search").replace("...", "")}
            </button>
          </div>
        </form>
      </div>

      {/* Zoom controls + Reset View + Locate + Play - 35% smaller */}
      <div className="absolute top-1/2 -translate-y-1/2 right-3 z-40 flex flex-col items-center gap-1.5">
        <div className="flex flex-col items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-1 py-1.5 shadow-lg border border-white/10">
          <button
            onClick={handleZoomIn}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/15 text-white text-sm leading-none hover:bg-white/25 transition z-50"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/15 text-white text-sm leading-none hover:bg-white/25 transition z-50"
            title="Zoom out"
          >
            –
          </button>
          <button
            onClick={handleResetView}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-white/15 text-white text-[10px] leading-none hover:bg-white/25 transition z-50"
            title="Reset view"
          >
            ⌂
          </button>
        </div>
        <button
          onClick={handleLocate}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white text-sm shadow-lg border border-white/10 hover:bg-black/60 transition z-50"
          title="Locate me"
        >
          📍
        </button>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-black/45 backdrop-blur-md text-white text-xs leading-none hover:bg-black/60 transition border border-white/15 shadow-lg"
          aria-label="Play/Pause"
          title="Play/Pause"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>

      {/* Bottom CTA - 35% smaller, adjusted for mobile spacing */}
      <div className="absolute inset-x-3 bottom-28 z-30">
        <button className="w-full bg-cyan-500 text-black font-semibold text-xs rounded-full py-2 shadow-xl flex items-center justify-center gap-1 hover:bg-cyan-400 transition">
          <span>Explain this pattern</span>
          <span className="text-sm">🤖</span>
        </button>
      </div>

      {/* Radar Legend - 35% smaller, narrow, left-aligned */}
      <style>
        {`
          .radar-legend {
            position: absolute !important;
            top: 140px !important;
            left: 12px !important;
            z-index: 900 !important;
            width: 20px !important;
            height: 200px !important;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .radar-legend .bar {
            width: 100% !important;
            height: 100% !important;
            border-radius: 12px;
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
            left: 28px;
            font-size: 9px;
            font-weight: 600;
            color: white;
            letter-spacing: 0.2px;
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

      {/* Bottom layer selector bar - moved upward additional 25px with increased padding for mobile */}
      <div className="absolute inset-x-3 bottom-16 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-black/60 backdrop-blur-lg border border-white/20 shadow-xl">
          <button
            onClick={() => handleLayerChange("radar")}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition ${
              selectedLayer === "radar" 
                ? "bg-white/20 scale-105" 
                : "hover:bg-white/10"
            }`}
            title="Radar"
          >
            <span className="text-sm">🌧</span>
            <span className="text-[7px] font-medium text-white/90">Radar</span>
          </button>
          <button
            onClick={() => handleLayerChange("clouds")}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition ${
              selectedLayer === "clouds" 
                ? "bg-white/20 scale-105" 
                : "hover:bg-white/10"
            }`}
            title="Clouds"
          >
            <span className="text-sm">☁️</span>
            <span className="text-[7px] font-medium text-white/90">Clouds</span>
          </button>
          <button
            onClick={() => handleLayerChange("wind")}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition ${
              selectedLayer === "wind" 
                ? "bg-white/20 scale-105" 
                : "hover:bg-white/10"
            }`}
            title="Wind"
          >
            <span className="text-sm">💨</span>
            <span className="text-[7px] font-medium text-white/90">Wind</span>
          </button>
          <button
            onClick={() => handleLayerChange("temperature")}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition ${
              selectedLayer === "temperature" 
                ? "bg-white/20 scale-105" 
                : "hover:bg-white/10"
            }`}
            title="Temperature"
          >
            <span className="text-sm">🌡️</span>
            <span className="text-[7px] font-medium text-white/90">Temp</span>
          </button>
          <button
            onClick={handleRefresh}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition hover:bg-white/10`}
            title="Refresh"
          >
            <span className="text-sm">🔄</span>
            <span className="text-[7px] font-medium text-white/90">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
