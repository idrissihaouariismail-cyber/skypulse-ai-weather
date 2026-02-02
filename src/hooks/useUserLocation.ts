import { useCallback, useEffect, useRef, useState } from "react";
import { getUserLocation } from "../utils/location";
import { getCityFromCoordinates, Coordinates } from "../../services/weather";

export type LocationStatus = "idle" | "detecting" | "granted" | "denied" | "error";

interface UseUserLocationOptions {
  /** Request location automatically on first mount */
  requestOnMount?: boolean;
}

interface UseUserLocationResult {
  status: LocationStatus;
  city: Coordinates | null;
  /** Request location (permission prompt + reverse geocoding). Use for "Use my location" button or retry. */
  requestLocation: () => Promise<void>;
}

export function useUserLocation(options: UseUserLocationOptions = {}): UseUserLocationResult {
  const { requestOnMount = false } = options;
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [city, setCity] = useState<Coordinates | null>(null);
  const hasRequestedOnMount = useRef(false);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setCity(null);
      return;
    }
    setStatus("detecting");
    setCity(null);
    try {
      const coords = await getUserLocation();
      if (!coords) {
        setStatus("denied");
        return;
      }
      const resolved = await getCityFromCoordinates(coords.lat, coords.lon);
      if (resolved) {
        setCity(resolved);
        setStatus("granted");
      } else {
        setCity({ lat: coords.lat, lon: coords.lon });
        setStatus("granted");
      }
    } catch {
      setStatus("error");
      setCity(null);
    }
  }, []);

  useEffect(() => {
    if (!requestOnMount || hasRequestedOnMount.current) return;
    hasRequestedOnMount.current = true;
    requestLocation();
  }, [requestOnMount, requestLocation]);

  return { status, city, requestLocation };
}
