import { useQuery } from "convex/react";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { Avatar } from "@/components/avatar";
import { api } from "@nudge/backend/convex/_generated/api";

export function HeaderActions() {
  const viewer = useQuery(api.profiles.getViewer);
  const initials = viewer?.fullName ?? viewer?.email ?? "";

  return (
    <View className="flex-row items-center gap-2">
      <Link href="/more/settings" asChild>
        <Pressable
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          className="rounded-full"
        >
          <Avatar name={viewer?.fullName ?? undefined} email={initials} size="sm" />
        </Pressable>
      </Link>
    </View>
  );
}
