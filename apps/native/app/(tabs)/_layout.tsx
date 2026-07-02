import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

import { useViewer } from "@/lib/use-viewer";

const TAB_ICON_SOURCES = {
  home: require("@/assets/tab-icons/home.png"),
  planner: require("@/assets/tab-icons/planner.png"),
  calendar: require("@/assets/tab-icons/calendar.png"),
  nudges: require("@/assets/tab-icons/nudges.png"),
  more: require("@/assets/tab-icons/more.png"),
  team: require("@/assets/tab-icons/team.png"),
  insights: require("@/assets/tab-icons/insights.png"),
} as const;

type TabIconName = keyof typeof TAB_ICON_SOURCES;

export default function TabsLayout() {
  const { config } = useViewer();
  const { tabs, palette } = config;

  return (
    <NativeTabs
      tintColor={palette.accent}
      labelStyle={{ selected: { color: palette.accent } }}
    >
      {tabs.map((tab) => {
        const iconSource = TAB_ICON_SOURCES[tab.name as TabIconName];
        return (
          <NativeTabs.Trigger key={tab.name} name={tab.name}>
            <Label>{tab.label}</Label>
            <Icon
              src={{ default: iconSource, selected: iconSource }}
              selectedColor={palette.accent}
            />
          </NativeTabs.Trigger>
        );
      })}
    </NativeTabs>
  );
}
