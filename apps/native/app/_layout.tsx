import "@/global.css";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env, envValidationError } from "@nudge/env/native";
import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, View } from "react-native";
import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Uniwind } from "uniwind";

import { authClient } from "@/lib/auth-client";
import { api } from "@nudge/backend/convex/_generated/api";
import { AuthGate } from "@/components/auth-gate";
import { LoadingScreen } from "@/components/loading-screen";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

function StartupErrorScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        backgroundColor: "#09090B",
      }}
    >
      <View style={{ width: "100%", maxWidth: 420, gap: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "600", color: "#FAFAFA" }}>
          Nudge startup blocked
        </Text>
        <Text style={{ fontSize: 14, color: "#A1A1AA" }}>
          Invalid or missing public Convex environment values were detected.
        </Text>
        <Text style={{ fontSize: 12, color: "#F87171", marginTop: 4 }}>{envValidationError}</Text>
      </View>
    </View>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureViewer = useMutation(api.profiles.ensureViewer);
  const viewer = useQuery(api.profiles.getViewer, isAuthenticated ? {} : "skip");
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    Uniwind.setTheme("light");
  }, []);

  useEffect(() => {
    if (!isAuthenticated || viewer !== null || hasBootstrapped.current) {
      return;
    }
    hasBootstrapped.current = true;
    void ensureViewer({});
  }, [ensureViewer, isAuthenticated, viewer]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  if (viewer === undefined || viewer === null) {
    return <LoadingScreen title="Preparing dashboard" message="Creating your profile..." />;
  }

  return (
    <>
      <StatusBar style="dark" translucent={false} />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function Layout() {
  if (envValidationError) {
    return <StartupErrorScreen />;
  }

  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HeroUINativeProvider>
          <AppNavigator />
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    </ConvexBetterAuthProvider>
  );
}
