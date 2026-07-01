import type { IconSvgElement } from "@hugeicons/react-native";
import type { Href } from "expo-router";
import { useTabTrigger } from "expo-router/ui";
import * as Haptics from "expo-haptics";
import { type ReactNode, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

import { Icon } from "@/components/icon";
import { setFocused, setLayout, useFloatingTabState } from "@/lib/floating-tab-store";
import { useViewer } from "@/lib/use-viewer";

export type TabDefinition = {
  name: string;
  href: Href;
  label: string;
  icon: IconSvgElement;
};

export const BAR_HEIGHT = 64;
export const BAR_INNER_PADDING = 6;
export const PILL_VERTICAL_INSET = 6;
export const PILL_HEIGHT = BAR_HEIGHT - PILL_VERTICAL_INSET * 2;
export const PILL_RADIUS = PILL_HEIGHT / 2 - 4;
export const PILL_MIN_WIDTH = 44;
export const TAB_CONTENT_HEIGHT = 28;
export const TAB_ICON_SIZE = 20;
export const TAB_LABEL_HORIZONTAL_PADDING = 8;
export const TAB_LABEL_ICON_GAP = 6;
export const TAB_LABEL_MIN_FONT_SCALE = 0.65;

type TabButtonProps = {
  tab: TabDefinition;
  accentColor: string;
};

export function TabButton({ tab, accentColor }: TabButtonProps): ReactNode {
  const { trigger, triggerProps } = useTabTrigger({
    name: tab.name,
    href: tab.href,
  });
  const isFocused = trigger?.isFocused ?? false;

  useEffect(() => {
    if (isFocused) {
      setFocused(tab.name);
    }
  }, [isFocused, tab.name]);

  return (
    <View
      style={{ flex: 1, alignItems: "stretch", justifyContent: "center" }}
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        setLayout(tab.name, { x, width });
      }}
    >
      <Pressable
        {...triggerProps}
        accessibilityRole="button"
        accessibilityLabel={tab.label}
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={(event) => {
          triggerProps.onPress?.(event);
          Haptics.selectionAsync().catch(() => undefined);
        }}
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: PILL_VERTICAL_INSET,
        }}
        className="active:opacity-70"
      >
        <View
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setLayout(tab.name, { contentWidth: width });
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            height: TAB_CONTENT_HEIGHT,
            gap: TAB_LABEL_ICON_GAP,
            paddingHorizontal: TAB_LABEL_HORIZONTAL_PADDING,
          }}
        >
          <View
            style={{
              width: TAB_ICON_SIZE,
              height: TAB_ICON_SIZE,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              icon={tab.icon}
              size={TAB_ICON_SIZE}
              strokeWidth={isFocused ? 2.25 : 1.85}
              color={isFocused ? accentColor : undefined}
              className={isFocused ? undefined : "text-muted"}
            />
          </View>
          {isFocused ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={TAB_LABEL_MIN_FONT_SCALE}
              className="text-[12px] font-semibold tracking-tight"
              style={{
                color: accentColor,
                lineHeight: TAB_ICON_SIZE,
                includeFontPadding: false,
                textAlignVertical: "center",
              }}
            >
              {tab.label}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

type ActivePillProps = {
  backgroundColor: string;
};

export function ActivePill({ backgroundColor }: ActivePillProps): ReactNode {
  const { focused, layouts } = useFloatingTabState();
  const target = focused ? layouts[focused] : undefined;

  const pillStyle = useAnimatedStyle(() => {
    const cellX = target?.x ?? 0;
    const cellWidth = target?.width ?? 0;
    const contentWidth = target?.contentWidth ?? cellWidth;
    const pillWidth = Math.max(contentWidth, PILL_MIN_WIDTH);
    const pillX = cellX + (cellWidth - pillWidth) / 2;
    return {
      transform: [
        {
          translateX: withSpring(pillX, { damping: 22, stiffness: 260, mass: 0.7 }),
        },
      ],
      width: withSpring(pillWidth, {
        damping: 22,
        stiffness: 260,
        mass: 0.7,
      }),
    };
  }, [target?.x, target?.width, target?.contentWidth]);

  if (!target) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: PILL_VERTICAL_INSET,
          left: 0,
          height: PILL_HEIGHT,
          borderRadius: PILL_RADIUS,
          backgroundColor,
        },
        pillStyle,
      ]}
    />
  );
}

export function useRoleTabs(): TabDefinition[] {
  const { config } = useViewer();
  return config.tabs;
}
