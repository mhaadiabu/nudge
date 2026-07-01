import { Stack } from "expo-router/stack";

import { HeaderActions } from "@/components/header-actions";
import { useTabHeaderScreenOptions } from "@/lib/header-options";

export default function CalendarLayout() {
  const screenOptions = useTabHeaderScreenOptions();
  return (
    <Stack
      screenOptions={{
        ...screenOptions,
        headerRight: () => <HeaderActions />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Calendar" }} />
    </Stack>
  );
}
