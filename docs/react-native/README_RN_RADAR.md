# SkyPulse React Native – In-App Radar (Windy)

Reference implementation for opening Windy radar **inside the app** via WebView. No `Linking.openURL`, no `window.open`, no external browser.

---

## 1. Dependencies

```bash
npm install react-native-webview
# or
yarn add react-native-webview
```

**iOS:** After install, run:

```bash
cd ios && pod install && cd ..
```

**Android:** No extra step; rebuild.

**Rebuild:** Required after adding `react-native-webview`:

```bash
npx react-native run-ios
npx react-native run-android
```

---

## 2. Navigation registration

Add the screen to your stack (e.g. existing `Stack.Navigator`):

```tsx
import InAppRadarScreen from './screens/InAppRadarScreen'; // adjust path

// Param list (add to your root stack types)
export type RootStackParamList = {
  Main: undefined;
  InAppRadar: { radarUrl: string };
  Settings: undefined;
  // ...
};

<Stack.Navigator screenOptions={{ headerShown: true }}>
  <Stack.Screen name="Main" component={MainTabsOrScreen} />
  <Stack.Screen
    name="InAppRadar"
    component={InAppRadarScreen}
    options={{
      title: 'Radar',
      headerBackTitle: 'Back',
      headerStyle: { backgroundColor: '#0a0a0a' },
      headerTintColor: '#fff',
    }}
  />
  {/* ... */}
</Stack.Navigator>
```

Back button in the header returns to SkyPulse (previous screen), not the app exit.

---

## 3. Radar button handler

**Do not use:** `Linking.openURL`, `window.open`, or any intent that opens Chrome/Safari.

Use navigation only and pass the prebuilt Windy URL:

```tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getWindyRadarUrl } from '../utils/radarUrl'; // or your path

type RootStackParamList = {
  Main: undefined;
  InAppRadar: { radarUrl: string };
};

// In your Dashboard (or screen that has the Radar button):
const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Main'>>();

// Use same lat/lon as weather (e.g. from context or props)
const lat = 37.77;   // from WeatherContext / selected city / geolocation
const lon = -122.42;

const handleRadarPress = () => {
  const radarUrl = getWindyRadarUrl(lat, lon);
  navigation.navigate('InAppRadar', { radarUrl });
};
```

Button:

```tsx
<TouchableOpacity onPress={handleRadarPress}>
  <Text>Radar</Text>
</TouchableOpacity>
```

---

## 4. Flow summary

1. User taps **Radar** → `handleRadarPress()` runs.
2. `getWindyRadarUrl(lat, lon)` builds `https://www.windy.com/?radar,{lat},{lon}` (or default if no location).
3. `navigation.navigate('InAppRadar', { radarUrl })` pushes InAppRadarScreen.
4. **InAppRadarScreen** mounts → shows label + loading → WebView loads `radarUrl`.
5. When WebView finishes loading, loading indicator hides. If load fails, error message is shown.
6. User taps **Back** in header → React Navigation pops the screen → back to previous SkyPulse screen. No browser, no app exit.

---

## 5. Files to copy into your RN project

| File | Purpose |
|------|--------|
| `radarUrl.ts` | Build Windy URL; use from Radar button. |
| `InAppRadarScreen.tsx` | Full-screen WebView + label + loading/error. |
| This README | Registration + handler + flow. |

Place `radarUrl.ts` in e.g. `src/utils/` or `utils/`, and `InAppRadarScreen.tsx` in `src/screens/` or `screens/`. Adjust imports in the screen and in the navigator/button.

---

## 6. Edge cases

- **No GPS / no location:** Pass `null, null` into `getWindyRadarUrl`; it returns the default Windy radar view.
- **Slow load:** WebView shows loading until `onLoadEnd` or `onError`; no extra timeout.
- **Load error:** `onError` sets local state and shows a short message; user can go Back.

---

## 7. Constraints satisfied

- No `Linking.openURL`, no `window.open`.
- No external browser; radar only inside WebView.
- Back = navigate back in the stack.
- Small top label: "You are viewing a professional external radar".
- Loading indicator and error handling.
- URL format: `https://www.windy.com/?radar,{latitude},{longitude}`; default when location unavailable.
