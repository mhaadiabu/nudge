import { Tabs, TabList, TabSlot, TabTrigger } from "expo-router/ui";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ActivePill,
  BAR_HEIGHT,
  BAR_INNER_PADDING,
  TabButton,
  useRoleTabs,
} from "@/components/floating-tab-bar";
import { pruneTabState } from "@/lib/floating-tab-store";
import { useViewer } from "@/lib/use-viewer";
import { shadows } from "@/lib/theme";

const BAR_HORIZONTAL_MARGIN = 20;
const BAR_BOTTOM_GAP = 6;
const TAB_BAR_INSET = BAR_HEIGHT + BAR_BOTTOM_GAP;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabs = useRoleTabs();
  const { config, isLoading, isMissing } = useViewer();
  const palette = config.palette;

  useEffect(() => {
    pruneTabState(tabs.map((tab) => tab.name));
  }, [tabs]);

  const isAndroid = Platform.OS === "android";
  const barStyle = isAndroid
    ? ({
        position: "absolute",
        left: BAR_HORIZONTAL_MARGIN,
        right: BAR_HORIZONTAL_MARGIN,
        bottom: insets.bottom + BAR_BOTTOM_GAP,
        height: BAR_HEIGHT,
        paddingHorizontal: BAR_INNER_PADDING,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(15, 23, 42, 0.10)",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      } as const)
    : ({
        position: "absolute",
        left: BAR_HORIZONTAL_MARGIN,
        right: BAR_HORIZONTAL_MARGIN,
        bottom: insets.bottom + BAR_BOTTOM_GAP,
        height: BAR_HEIGHT,
        paddingHorizontal: BAR_INNER_PADDING,
        borderRadius: 12,
        borderCurve: "continuous",
        backgroundColor: "rgba(255, 255, 255, 0.48)",
        borderWidth: 1,
        borderColor: "rgba(15, 23, 42, 0.10)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        ...shadows.elevated,
      } as const);

  if (isLoading || isMissing) {
    return (
      <Tabs className="bg-background" options={{ initialRouteName: "home" }}>
        <TabSlot style={{ paddingBottom: TAB_BAR_INSET }} />
      </Tabs>
    );
  }

  return (
    <Tabs className="bg-background" options={{ initialRouteName: "home" }}>
      <TabSlot style={{ paddingBottom: TAB_BAR_INSET }} />
      <TabList style={barStyle}>
        {tabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton tab={tab} accentColor={palette.accent} />
          </TabTrigger>
        ))}
        <ActivePill backgroundColor={palette.accentSoft} />
      </TabList>
    </Tabs>
  );
}
