import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ScreenShell } from "@/components/screen-shell";

const moreItems = [
  {
    label: "Resources",
    description: "Lecture notes, templates, recordings",
    icon: "folder-open-outline",
    route: "/more/resources",
  },
  {
    label: "Announcements",
    description: "Timetable changes, assessments, events",
    icon: "megaphone-outline",
    route: "/more/announcements",
  },
  {
    label: "Settings",
    description: "Profile, notifications, consent",
    icon: "settings-outline",
    route: "/more/settings",
  },
  {
    label: "Management",
    description: "Publish content, monitor pilot",
    icon: "briefcase-outline",
    route: "/more/management",
    managerOnly: true,
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const viewer = useQuery(api.profiles.getViewer);
  const isManager = viewer && viewer.primaryRole !== "student";

  return (
    <ScreenShell title="More">
      <View>
        {moreItems.map((item, index) => {
          if (item.managerOnly && !isManager) {
            return null;
          }
          return (
            <View key={item.route}>
              {index > 0 ? <View className="h-px bg-border" /> : <View className="h-2" />}
              <Pressable
                onPress={() => {
                  router.push(item.route as any);
                }}
                className="flex-row items-center gap-4 py-4"
              >
                <Ionicons name={item.icon as any} size={20} className="text-foreground" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-medium text-foreground">{item.label}</Text>
                  <Text className="text-sm text-muted">{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} className="text-muted" />
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScreenShell>
  );
}
