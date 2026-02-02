/**
 * InAppRadarScreen – SkyPulse React Native
 * Loads Windy radar inside WebView. No external browser. Back returns to app.
 *
 * Dependencies: react-native-webview, @react-navigation/native
 * Rebuild after adding react-native-webview: npx pod-install (iOS) / clean build (Android).
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { useRoute, RouteProp } from "@react-navigation/native";

/** Param list for this screen – merge into your RootStackParamList */
export type InAppRadarParams = {
  InAppRadar: { radarUrl: string };
};

const EXTERNAL_LABEL = "You are viewing a professional external radar";
const DEFAULT_RADAR_URL = "https://www.windy.com/?radar,40.71,-74.01";

export default function InAppRadarScreen() {
  const route = useRoute<RouteProp<InAppRadarParams, "InAppRadar">>();
  const radarUrl = route.params?.radarUrl ?? DEFAULT_RADAR_URL;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setLoadError(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Non-intrusive label at top */}
      <View style={styles.labelBar}>
        <Text style={styles.labelText} numberOfLines={1}>
          {EXTERNAL_LABEL}
        </Text>
      </View>

      {/* Loading indicator – centered until WebView loads */}
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading radar…</Text>
        </View>
      )}

      {/* Error state – no GPS / slow network fallback */}
      {loadError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Radar could not load. Check your connection.</Text>
        </View>
      )}

      <WebView
        source={{ uri: radarUrl }}
        style={styles.webview}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={false}
        incognito={false}
        allowsBackForwardNavigationGestures={false}
        // Back button is handled by React Navigation header; no in-WebView back.
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  labelBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  labelText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingTop: 100,
  },
  errorText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  webview: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
