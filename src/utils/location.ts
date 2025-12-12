/**
 * Get user's current geographic location using browser Geolocation API
 * @returns Promise resolving to coordinates or null if unavailable/denied
 */
export async function getUserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true }
    );
  });
}

