import { Stack } from "expo-router/stack";

import { HeaderActions } from "@/components/header-actions";

export default function TeamLayout() {
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
      <Stack.Screen name="index" options={{ title: "Team" }} />
    </Stack>
  );
}
