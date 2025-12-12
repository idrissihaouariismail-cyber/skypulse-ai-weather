import { auth } from './config.js'; // For auth state
// Import functions from other modules as needed for each page
import { getCoordinates, getCurrentWeather, getSevenDayForecast } from './weather.js';
import { getAirQuality } from './airquality.js';
import { getUserSettings, addSavedLocation, getSavedLocations, updateUserSettings, removeSavedLocation } from './firestore.js';
import { initializeRadarMap } from './map.js';

// --- Page-specific Initialization Functions ---

async function initDashboardPage() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = '/'; // Redirect to login if not authenticated
    return;
  }
  console.log("Initializing Dashboard Page...");
  // Example: Fetch and display weather for a default/user-saved location
  const userSettings = await getUserSettings();
  const defaultCity = userSettings?.savedLocations?.[0] || "London"; // Use first saved loc or London
  await fetchAndDisplayWeatherData(defaultCity); // Defined in weather.js embedding section
  // Add event listeners for search bar, etc.
}

async function initForecastPage() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = '/';
    return;
  }
  console.log("Initializing Forecast Page...");
  const userSettings = await getUserSettings();
  const defaultCity = userSettings?.savedLocations?.[0] || "London";
  await fetchAndDisplayWeatherData(defaultCity); // Re-use from weather.js embedding
  // Potentially render charts here
}

async function initAirQualityPage() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = '/';
    return;
  }
  console.log("Initializing Air Quality Page...");
  const userSettings = await getUserSettings();
  const defaultCity = userSettings?.savedLocations?.[0] || "London";
  await fetchAndDisplayAirQuality(defaultCity); // Defined in airquality.js embedding section
}

async function initRadarMapPage() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = '/';
    return;
  }
  console.log("Initializing Radar Map Page...");
  const userSettings = await getUserSettings();
  const defaultCity = userSettings?.savedLocations?.[0] || "London";
  const coords = await getCoordinates(defaultCity);
  const lat = coords ? coords.lat : 0;
  const lon = coords ? coords.lon : 0;
  const zoom = coords ? 9 : 2;
  initializeRadarMap('map', lat, lon, zoom); // Ensure map container has ID 'map'
}

async function initSettingsPage() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = '/';
    return;
  }
  console.log("Initializing Settings Page...");
  // Load and display current settings and saved locations
  const settings = await getUserSettings();
  if (settings) {
    document.getElementById('unitSelect').value = settings.unit;
    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('languageSelect').value = settings.language;
  }

  const savedLocs = await getSavedLocations();
  const savedLocationsList = document.getElementById('savedLocationsList'); // Assume a UL or DIV for this
  if (savedLocationsList) {
    savedLocationsList.innerHTML = ''; // Clear previous list
    savedLocs.forEach(loc => {
      const li = document.createElement('li');
      li.textContent = loc;
      // Add a remove button if desired
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = async () => {
        const success = await removeSavedLocation(loc);
        if (success) {
          alert("Location removed!");
          initSettingsPage(); // Refresh list
        }
      };
      li.appendChild(removeBtn);
      savedLocationsList.appendChild(li);
    });
  }

  // Add event listeners for settings updates and adding/removing locations
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('change', async (e) => {
      const unit = document.getElementById('unitSelect').value;
      const theme = document.getElementById('themeSelect').value;
      const language = document.getElementById('languageSelect').value;
      const success = await updateUserSettings({ unit, theme, language });
      if (success) {
        alert("Settings updated!");
      }
    });
  }

  const addLocationForm = document.getElementById('addLocationForm'); // Or a button
  if (addLocationForm) {
    addLocationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newLocationInput = document.getElementById('newLocationInput'); // Assume input field
      const newLocation = newLocationInput.value;
      if (newLocation) {
        const success = await addSavedLocation(newLocation);
        if (success) {
          alert("Location saved!");
          newLocationInput.value = ''; // Clear input
          initSettingsPage(); // Refresh list
        }
      }
    });
  }
}

// --- Main Router Function ---
function handleRouting() {
  const path = window.location.pathname;
  if (path.includes('ai_weather_dashboard_for_skypulse_ai')) {
    initDashboardPage();
  } else if (path.includes('forecast_screen_for_skypulse_ai')) {
    initForecastPage();
  } else if (path.includes('air_quality_screen_for_skypulse_ai')) {
    initAirQualityPage();
  } else if (path.includes('interactive_radar_map_for_skypulse_ai')) {
    initRadarMapPage();
  } else if (path.includes('settings_screen_for_skypulse_ai')) {
    initSettingsPage();
  } else {
    // Default or login/signup page
    console.log("Loading default/auth page.");
    // Ensure auth.js is properly linked for login/signup forms
  }
}

// --- Initialize App on Load ---
document.addEventListener('DOMContentLoaded', handleRouting);

// Listen for Firebase auth state changes to protect routes
auth.onAuthStateChanged(user => {
  const currentPath = window.location.pathname;
  // If user is not logged in and not on a public page (e.g., login/signup)
  const publicPaths = ['/', '/index.html', '/login.html', '/signup.html']; // Adjust as per your actual login/signup page
  if (!user && !publicPaths.some(p => currentPath.includes(p))) {
    window.location.href = '/'; // Redirect to login/landing page
  } else if (user && publicPaths.some(p => currentPath.includes(p)) && currentPath !== '/index.html') {
    // If user is logged in and tries to access login/signup page, redirect to dashboard
    window.location.href = '/ai_weather_dashboard_for_skypulse_ai/index.html';
  }
  // Re-run routing logic to ensure correct page setup based on auth state
  handleRouting();
});


// Exporting functions if you need to call them from other modules (less likely for app.js)
// export { handleRouting };