import { Ionicons } from "@expo/vector-icons";
import { api } from "@nudge/backend/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import React, { useCallback, useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";

import { AuthGate } from "@/components/auth-gate";
import { LoadingScreen } from "@/components/loading-screen";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";

function DrawerLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureViewer = useMutation(api.profiles.ensureViewer);
  const viewer = useQuery(api.profiles.getViewer, isAuthenticated ? {} : "skip");
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");
  const hasBootstrapped = useRef(false);

  const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

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
    return (
      <LoadingScreen title="Preparing your dashboard" message="Creating your UPSA profile..." />
    );
  }

  return (
    <Drawer
      screenOptions={{
        headerTintColor: themeColorForeground,
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: {
          fontWeight: "600",
          color: themeColorForeground,
        },
        headerRight: () => (
          <View className="mr-2 flex-row items-center">
            {renderThemeToggle()}
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
        drawerStyle: { backgroundColor: themeColorBackground },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "Dashboard",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Dashboard</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="grid-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="planner"
        options={{
          headerTitle: "Planner",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Planner</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="checkbox-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="calendar"
        options={{
          headerTitle: "Calendar",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Calendar</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="resources"
        options={{
          headerTitle: "Resources",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Resources</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="folder-open-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="announcements"
        options={{
          headerTitle: "Announcements",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Announcements</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="megaphone-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="nudges"
        options={{
          headerTitle: "Nudges",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Nudges</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="notifications-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          headerTitle: "Settings",
          drawerLabel: ({ color, focused }) => (
            <Text style={{ color: focused ? color : themeColorForeground }}>Settings</Text>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      {viewer.role !== "student" ? (
        <Drawer.Screen
          name="management"
          options={{
            headerTitle: "Management",
            drawerLabel: ({ color, focused }) => (
              <Text style={{ color: focused ? color : themeColorForeground }}>Management</Text>
            ),
            drawerIcon: ({ size, color, focused }) => (
              <Ionicons
                name="briefcase-outline"
                size={size}
                color={focused ? color : themeColorForeground}
              />
            ),
          }}
        />
      ) : null}
    </Drawer>
  );
}

export default DrawerLayout;
