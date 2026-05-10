import "@/global.css";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env, envValidationError } from "@nudge/env/native";
import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, View } from "react-native";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";

export const unstable_settings = {
  initialRouteName: "(drawer)",
};

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(drawer)" />
    </Stack>
  );
}

function StartupErrorScreen() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        backgroundColor: "#09090B",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 16,
          padding: 16,
          backgroundColor: "#18181B",
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "600", color: "#FAFAFA" }}>Nudge startup blocked</Text>
        <Text style={{ fontSize: 14, color: "#A1A1AA" }}>
          Invalid or missing public Convex environment values were detected. Rebuild with
          EXPO_PUBLIC_CONVEX_URL and EXPO_PUBLIC_CONVEX_SITE_URL set.
        </Text>
        <Text style={{ fontSize: 12, color: "#F87171" }}>{envValidationError}</Text>
      </View>
    </View>
  );
}

export default function Layout() {
  if (envValidationError) {
    return <StartupErrorScreen />;
  }

  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppThemeProvider>
          <HeroUINativeProvider>
            <StackLayout />
          </HeroUINativeProvider>
        </AppThemeProvider>
      </GestureHandlerRootView>
    </ConvexBetterAuthProvider>
  );
}
