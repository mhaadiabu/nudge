import { Stack } from "expo-router/stack";

import { HeaderActions } from "@/components/header-actions";
import { tabHeaderScreenOptions } from "@/lib/header-options";

export default function CalendarLayout() {
  return (
    <Stack
      screenOptions={{
        ...tabHeaderScreenOptions(),
        headerRight: () => <HeaderActions />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Calendar" }} />
    </Stack>
  );
}
