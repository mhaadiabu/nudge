import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  ArrowRight01Icon,
  Briefcase01Icon,
  Folder01Icon,
  Megaphone01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import { useViewer } from "@/lib/use-viewer";

type MoreItem = {
  label: string;
  description: string;
  icon: IconSvgElement;
  route: "/more/announcements" | "/more/resources" | "/more/settings" | "/more/management";
  managerOnly?: boolean;
};

const allItems: MoreItem[] = [
  {
    label: "Resources",
    description: "Lecture notes, templates, recordings",
    icon: Folder01Icon,
    route: "/more/resources",
  },
  {
    label: "Announcements",
    description: "Timetable changes, assessments, events",
    icon: Megaphone01Icon,
    route: "/more/announcements",
  },
  {
    label: "Settings",
    description: "Profile, notifications, consent",
    icon: Settings01Icon,
    route: "/more/settings",
  },
  {
    label: "Management",
    description: "Publish content, monitor pilot",
    icon: Briefcase01Icon,
    route: "/more/management",
    managerOnly: true,
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { config, isManager } = useViewer();

  const items = allItems.filter((item) => !item.managerOnly || isManager);

  return (
    <ScreenShell>
      <SectionCard
        title="Workspace"
        description={`Signed in as a ${config.label.toLowerCase()}`}
        flat
      >
        {items.map((item, index) => (
          <Pressable
            key={item.route}
            onPress={() => {
              router.push(item.route);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.label}`}
            className={`flex-row items-center gap-3.5 py-3.5 active:opacity-60 ${
              index > 0 ? "border-t border-separator" : ""
            }`}
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-xl bg-accent-soft"
              style={{ borderCurve: "continuous" }}
            >
              <Icon
                icon={item.icon}
                size={18}
                strokeWidth={2}
                className="text-accent-soft-foreground"
              />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-medium text-foreground">{item.label}</Text>
              <Text className="text-sm leading-5 text-muted">{item.description}</Text>
            </View>
            <Icon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="text-muted" />
          </Pressable>
        ))}
      </SectionCard>

      <SectionCard title="Appearance" icon={Settings01Icon} flat>
        <Text className="text-sm leading-5 text-muted">
          Pick how Nudge should look. You can switch any time.
        </Text>
        <ThemeSwitcher />
      </SectionCard>

      <View className="items-center pt-2">
        <Text className="text-xs text-muted">Nudge · {config.label} workspace</Text>
      </View>
    </ScreenShell>
  );
}
