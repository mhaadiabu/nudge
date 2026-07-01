import { Stack } from "expo-router/stack";

import { HeaderActions } from "@/components/header-actions";
import { tabHeaderScreenOptions } from "@/lib/header-options";

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        ...tabHeaderScreenOptions(),
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
