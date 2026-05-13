import "@/global.css";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { env, envValidationError } from "@nudge/env/native";
import { ConvexReactClient } from "convex/react";
import { Tabs } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Pressable, Text, View } from "react-native";
import { useThemeColor } from "heroui-native";
import { useEffect, useRef } from "react";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { authClient } from "@/lib/auth-client";
import { api } from "@nudge/backend/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { AuthGate } from "@/components/auth-gate";
import { LoadingScreen } from "@/components/loading-screen";
import { ThemeToggle } from "@/components/theme-toggle";

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
          Invalid or missing public Convex environment values were detected.
        </Text>
        <Text style={{ fontSize: 12, color: "#F87171" }}>{envValidationError}</Text>
      </View>
    </View>
  );
}

function AppTabs() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureViewer = useMutation(api.profiles.ensureViewer);
  const viewer = useQuery(api.profiles.getViewer, isAuthenticated ? {} : "skip");
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");
  const themeColorBorder = useThemeColor("border");
  const hasBootstrapped = useRef(false);

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
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: { fontWeight: "600", color: themeColorForeground },
        headerRight: () => (
          <View className="mr-3 flex-row items-center gap-2">
            <ThemeToggle />
            <Pressable
              onPress={() => {
                authClient.signOut();
              }}
              className="rounded-full px-2 py-1"
            >
              <Text className="text-sm text-foreground">Sign out</Text>
            </Pressable>
          </View>
        ),
        tabBarStyle: { backgroundColor: themeColorBackground, borderTopColor: themeColorBorder },
        tabBarActiveTintColor: themeColorForeground,
        tabBarInactiveTintColor: themeColorForeground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          headerTitle: "Planner",
          tabBarLabel: "Planner",
          tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          headerTitle: "Calendar",
          tabBarLabel: "Calendar",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nudges"
        options={{
          headerTitle: "Nudges",
          tabBarLabel: "Nudges",
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          headerTitle: "More",
          tabBarLabel: "More",
          tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
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
            <AppTabs />
          </HeroUINativeProvider>
        </AppThemeProvider>
      </GestureHandlerRootView>
    </ConvexBetterAuthProvider>
  );
}