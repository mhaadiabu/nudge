import { Stack } from "expo-router/stack";

import { HeaderActions } from "@/components/header-actions";

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerLargeTitleShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerBlurEffect: "systemMaterial",
        headerRight: () => <HeaderActions />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "More" }} />
      <Stack.Screen name="announcements" options={{ title: "Announcements" }} />
      <Stack.Screen name="resources" options={{ title: "Resources" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="management" options={{ title: "Management" }} />
    </Stack>
  );
}
