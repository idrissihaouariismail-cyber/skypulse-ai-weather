/**
 * SkyPulse Radar - Production Implementation
 * FIXED: Explicit container sizing and Leaflet initialization
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  const CONFIG = {
    RAINVIEWER_API: 'https://api.rainviewer.com/public/weather-maps.json',
    FIXED_ZOOM: 5,
    DEFAULT_LAT: 35,
    DEFAULT_LON: 10,
    ANIMATION_INTERVAL: 500,
    RADAR_OPACITY: 0.7,
    FRAME_MAX_AGE: 2 * 60 * 60,
    TILE_SIZE: 256,
    COLOR_SCHEME: 1,
    SMOOTH: 1
  };

  // ============================================================================
  // STATE
  // ============================================================================
  
  let map = null;
  let radarLayer = null;
  let radarTimestamps = [];
  let currentFrameIndex = 0;
  let isPlaying = true;
  let animationInterval = null;
  let isMapReady = false;
  let initAttempts = 0;
  const MAX_INIT_ATTEMPTS = 10;

  // ============================================================================
  // DOM ELEMENTS
  // ============================================================================
  
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const mapContainer = document.getElementById('map');

  // ============================================================================
  // UTILITIES
  // ============================================================================

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      lat: parseFloat(params.get('lat')) || CONFIG.DEFAULT_LAT,
      lon: parseFloat(params.get('lon')) || CONFIG.DEFAULT_LON,
      zoom: parseFloat(params.get('zoom')) || CONFIG.FIXED_ZOOM
    };
  }

  function showError(message) {
    console.error('[Radar]', message);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function hideLoading() {
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }

  /**
   * CRITICAL: Force explicit dimensions on map container
   * This fixes the invisible map issue
   */
  function forceContainerDimensions() {
    if (!mapContainer) {
      showError('Map container not found');
      return false;
    }

    // Force explicit dimensions using multiple methods
    mapContainer.style.position = 'fixed';
    mapContainer.style.top = '0';
    mapContainer.style.left = '0';
    mapContainer.style.width = '100vw';
    mapContainer.style.height = '100vh';
    mapContainer.style.minWidth = '100vw';
    mapContainer.style.minHeight = '100vh';
    mapContainer.style.margin = '0';
    mapContainer.style.padding = '0';
    mapContainer.style.zIndex = '1';
    mapContainer.style.background = '#1a1a1a';

    // Also set via setAttribute for maximum compatibility
    mapContainer.setAttribute('style', 
      'position: fixed !important; ' +
      'top: 0 !important; ' +
      'left: 0 !important; ' +
      'width: 100vw !important; ' +
      'height: 100vh !important; ' +
      'min-width: 100vw !important; ' +
      'min-height: 100vh !important; ' +
      'margin: 0 !important; ' +
      'padding: 0 !important; ' +
      'z-index: 1 !important; ' +
      'background: #1a1a1a !important;'
    );

    // Verify dimensions
    const rect = mapContainer.getBoundingClientRect();
    console.log('[Radar] Container dimensions:', rect.width, 'x', rect.height);
    
    if (rect.width === 0 || rect.height === 0) {
      console.error('[Radar] Container has zero dimensions!');
      return false;
    }

    return true;
  }

  // ============================================================================
  // RADAR DATA
  // ============================================================================

  function validateTimestamps(timestamps) {
    const now = Math.floor(Date.now() / 1000);
    const valid = timestamps.filter(ts => {
      const age = now - ts;
      return age >= 0 && age <= CONFIG.FRAME_MAX_AGE;
    });
    return valid.length > 0 ? valid : timestamps;
  }

  async function fetchRadarTimestamps() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(CONFIG.RAINVIEWER_API, {
        cache: 'no-cache',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const allTimestamps = [
        ...(data.radar.past || []).map(t => t.time),
        ...(data.radar.nowcast || []).map(t => t.time)
      ];
      
      const sorted = allTimestamps.sort((a, b) => a - b);
      return validateTimestamps(sorted);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  function getRadarTileUrl(timestamp) {
    return `https://tilecache.rainviewer.com/v2/radar/${timestamp}/${CONFIG.TILE_SIZE}/{z}/{x}/{y}/${CONFIG.COLOR_SCHEME}/${CONFIG.SMOOTH}.png`;
  }

  // ============================================================================
  // MAP LAYERS
  // ============================================================================

  function updateRadarLayer(timestamp) {
    if (!map || !isMapReady) {
      return;
    }

    try {
      if (radarLayer) {
        map.removeLayer(radarLayer);
        radarLayer = null;
      }

      radarLayer = L.tileLayer(getRadarTileUrl(timestamp), {
        opacity: CONFIG.RADAR_OPACITY,
        zIndex: 1000,
        attribution: 'RainViewer',
        maxZoom: 19,
        tileSize: CONFIG.TILE_SIZE
      });

      radarLayer.addTo(map);
    } catch (error) {
      console.error('[Radar] Error updating layer:', error);
    }
  }

  // ============================================================================
  // ANIMATION
  // ============================================================================

  function startAnimation() {
    if (animationInterval || radarTimestamps.length === 0) {
      return;
    }

    animationInterval = setInterval(() => {
      if (!isPlaying || radarTimestamps.length === 0) {
        return;
      }

      currentFrameIndex = (currentFrameIndex + 1) % radarTimestamps.length;
      const timestamp = radarTimestamps[currentFrameIndex];
      
      if (timestamp) {
        updateRadarLayer(timestamp);
      }
    }, CONFIG.ANIMATION_INTERVAL);
  }

  function stopAnimation() {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
    }
  }

  // ============================================================================
  // MAP INITIALIZATION
  // ============================================================================

  /**
   * CRITICAL: Initialize Leaflet map with explicit sizing
   */
  function initMap() {
    // Force container dimensions BEFORE creating map
    if (!forceContainerDimensions()) {
      return false;
    }

    if (typeof L === 'undefined') {
      initAttempts++;
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        setTimeout(checkAndInit, 200);
        return false;
      }
      showError('Leaflet.js failed to load. Check your internet connection.');
      return false;
    }

    const params = getUrlParams();

    try {
      console.log('[Radar] Initializing Leaflet map...');
      console.log('[Radar] Container size:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
      
      // Create map
      map = L.map('map', {
        center: [params.lat, params.lon],
        zoom: CONFIG.FIXED_ZOOM,
        minZoom: CONFIG.FIXED_ZOOM,
        maxZoom: CONFIG.FIXED_ZOOM,
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false
      });

      // Add dark tile layer
      const darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        tileSize: 256
      });

      darkTileLayer.addTo(map);

      // CRITICAL: Wait for map ready, then invalidate size
      map.whenReady(function() {
        console.log('[Radar] Map loaded');
        isMapReady = true;
        
        // Force size recalculation
        setTimeout(() => {
          map.invalidateSize();
          console.log('[Radar] Map size invalidated');
          
          // Verify map is visible
          const mapDiv = map.getContainer();
          const mapRect = mapDiv.getBoundingClientRect();
          console.log('[Radar] Map container size:', mapRect.width, 'x', mapRect.height);
          
          if (mapRect.width === 0 || mapRect.height === 0) {
            console.error('[Radar] Map container still has zero dimensions!');
            showError('Map container has zero dimensions. Check CSS.');
            return;
          }
          
          hideLoading();
          loadRadarData();
        }, 200);
      });

      // Handle tile errors
      map.on('tileerror', function(error) {
        console.warn('[Radar] Tile error:', error);
      });

      return true;
    } catch (error) {
      console.error('[Radar] Map creation error:', error);
      showError('Failed to create map: ' + error.message);
      return false;
    }
  }

  async function loadRadarData() {
    try {
      console.log('[Radar] Loading radar data...');
      radarTimestamps = await fetchRadarTimestamps();
      
      if (radarTimestamps.length > 0) {
        console.log(`[Radar] Loaded ${radarTimestamps.length} frames`);
        currentFrameIndex = radarTimestamps.length - 1;
        updateRadarLayer(radarTimestamps[currentFrameIndex]);
        startAnimation();
      } else {
        console.warn('[Radar] No radar data available');
      }
    } catch (error) {
      console.error('[Radar] Error loading radar:', error);
    }
  }

  // ============================================================================
  // WEBVIEW COMMUNICATION
  // ============================================================================

  window.addEventListener('message', (event) => {
    const data = event.data;
    
    if (!data || typeof data !== 'object') {
      return;
    }

    switch (data.type) {
      case 'play':
        isPlaying = true;
        startAnimation();
        break;
        
      case 'pause':
        isPlaying = false;
        stopAnimation();
        break;
        
      case 'updateCenter':
        if (map && typeof data.lat === 'number' && typeof data.lon === 'number') {
          map.setView([data.lat, data.lon], CONFIG.FIXED_ZOOM, {
            animate: true,
            duration: 1.0
          });
        }
        break;
        
      case 'setFrame':
        if (typeof data.index === 'number' && radarTimestamps[data.index]) {
          currentFrameIndex = Math.max(0, Math.min(data.index, radarTimestamps.length - 1));
          updateRadarLayer(radarTimestamps[currentFrameIndex]);
        }
        break;
    }
  });

  // ============================================================================
  // PERFORMANCE
  // ============================================================================

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isPlaying = false;
      stopAnimation();
    }
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    if (map) {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function checkAndInit() {
    if (typeof L === 'undefined') {
      initAttempts++;
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        setTimeout(checkAndInit, 200);
        return;
      }
      showError('Leaflet.js failed to load');
      return;
    }
    
    console.log('[Radar] Leaflet loaded, initializing...');
    initMap();
  }

  function initialize() {
    // CRITICAL: Force body/html dimensions first
    document.documentElement.style.height = '100%';
    document.documentElement.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.width = '100%';
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkAndInit, 100);
      });
    } else {
      setTimeout(checkAndInit, 100);
    }
  }

  // Start
  initialize();

  // ============================================================================
  // CLEANUP
  // ============================================================================

  window.addEventListener('beforeunload', () => {
    stopAnimation();
    if (map) {
      map.remove();
      map = null;
    }
  });

})();
