# Radar Page Architecture

## Overview

The Radar page is implemented as a **hybrid architecture** combining:
- **Web-based map** (Mapbox + RainViewer) for radar visualization
- **Native React components** for AI analysis and UI controls

## Current Implementation (V1 - Production)

### Components

1. **`components/RadarMap.tsx`** (Current - React + Mapbox)
   - Full React component with Mapbox GL JS
   - RainViewer API integration
   - Native AI analysis panel with typing animation
   - Native layer controls
   - **Status**: ✅ Production-ready, stable, zero black screen issues
   - **Fixes Applied**:
     - ✅ Map ready state management (`map.on('load')`)
     - ✅ Frame validation (expired frame filtering)
     - ✅ No opacity animations (frame index only)
     - ✅ Map component stays mounted
     - ✅ Layer updates without recreating map

### Features

- ✅ Mapbox GL JS integration
- ✅ RainViewer legal radar tiles
- ✅ Animated timeline (past → nowcast)
- ✅ City-based auto-centering
- ✅ Frame validation (expired frame filtering)
- ✅ Map ready state management
- ✅ Zero black screen issues
- ✅ Smooth animation (frame index only)

## Alternative Implementation (V2 - WebView for Mobile)

### Components

1. **`public/radar.html`** (Standalone web page)
   - Pure HTML/JS implementation (no React)
   - Mapbox GL JS embedded via CDN
   - RainViewer API integration
   - Self-contained radar visualization
   - Frame validation and animation logic
   - **Purpose**: WebView embedding for mobile apps
   - **Features**:
     - ✅ Zero black screen (waits for map.on('load'))
     - ✅ Frame validation (expired frame filtering)
     - ✅ Smooth animation (500ms intervals)
     - ✅ PostMessage API for control

2. **`components/RadarWebView.tsx`** (WebView wrapper)
   - React component wrapping iframe
   - Native AI analysis panel with typing animation
   - Native layer controls (Rain, Wind, Clouds, Temperature)
   - PostMessage communication with iframe
   - **Purpose**: Bridge between native React and web radar
   - **Features**:
     - ✅ Full AI insight generation (same as RadarMap)
     - ✅ Typing animation on page load
     - ✅ Layer-specific insights
     - ✅ Play/Pause control via PostMessage

### Architecture

```
┌─────────────────────────────────────┐
│   RadarWebView (React Native)      │
│  ┌───────────────────────────────┐ │
│  │  AI Analysis Panel (Native)   │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  iframe: radar.html (Web)     │ │
│  │  - Mapbox map                  │ │
│  │  - RainViewer tiles            │ │
│  │  - Animation logic             │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Layer Controls (Native)      │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Communication

**Native → Web (PostMessage)**
```javascript
// Update map center
iframe.contentWindow.postMessage({
  type: 'updateCenter',
  lat: 35.0,
  lon: 10.0
}, '*');

// Play/Pause animation
iframe.contentWindow.postMessage({
  type: 'play' // or 'pause'
}, '*');
```

**Web → Native (Future)**
- Can use `window.parent.postMessage()` for events
- Currently one-way communication

## Migration Path

### V1 → V2 (If needed)

1. **Keep V1 as default** (current implementation)
2. **V2 available** for mobile WebView integration
3. **Switch implementation** in `App.tsx`:

```typescript
// Current (V1)
import RadarMap from "./components/RadarMap";

// Alternative (V2)
import RadarWebView from "./components/RadarWebView";
```

## Performance Comparison

### V1 (React + Mapbox)
- ✅ Faster initial load (no iframe overhead)
- ✅ Better React integration
- ✅ Direct state management
- ✅ Easier debugging

### V2 (WebView)
- ✅ Isolated map rendering
- ✅ Better for mobile apps
- ✅ Can be cached separately
- ⚠️ Slight iframe overhead
- ⚠️ PostMessage latency

## Recommendations

### For Web App (Current)
- **Use V1** (`RadarMap.tsx`)
- Better performance
- Simpler architecture
- Direct React integration

### For Mobile App (Future)
- **Use V2** (`RadarWebView.tsx` + `radar.html`)
- Better isolation
- Easier to embed in native apps
- Can be served from CDN

## File Structure

```
components/
  ├── RadarMap.tsx          # V1: Full React implementation
  └── RadarWebView.tsx       # V2: WebView wrapper

public/
  └── radar.html            # V2: Standalone web radar page

services/
  └── rainviewer.ts         # Shared: RainViewer API service
```

## Configuration

### Environment Variables

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### URL Parameters (radar.html)

- `token`: Mapbox access token
- `lat`: Latitude (default: 35)
- `lon`: Longitude (default: 10)
- `zoom`: Zoom level (default: 5)

## Legal Compliance

- ✅ **RainViewer API**: Legal, free tier available
- ✅ **Mapbox**: Requires API token (free tier available)
- ✅ **No data storage**: All data fetched on-demand
- ✅ **CORS compliant**: Proper headers and origins

## Future Enhancements

### V1 Roadmap
- [ ] Add more layer types (wind, clouds, temperature)
- [ ] Improve AI insight quality
- [ ] Add radar history playback
- [ ] Performance optimizations

### V2 Roadmap
- [ ] Bi-directional communication
- [ ] Offline caching
- [ ] Progressive Web App support
- [ ] Service Worker for radar tiles

## Troubleshooting

### Black Screen Issues
- ✅ Fixed in V1: Map ready state management
- ✅ Fixed in V1: Frame validation
- ✅ Fixed in V1: No opacity animations

### Animation Issues
- ✅ Fixed: Frame index only (no opacity)
- ✅ Fixed: Proper interval cleanup
- ✅ Fixed: Valid frame filtering

### Performance Issues
- ✅ Optimized: Memoized calculations
- ✅ Optimized: Efficient re-renders
- ✅ Optimized: Frame validation

