import { Surface } from "heroui-native";
import type { IconSvgElement } from "@hugeicons/react-native";
import { type PropsWithChildren } from "react";
import { Platform, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Icon } from "@/components/icon";
import { shadows } from "@/lib/theme";
import type { AccentPalette } from "@/lib/role-config";

type SectionCardProps = PropsWithChildren<{
  title?: string;
  description?: string;
  trailing?: React.ReactNode;
  icon?: IconSvgElement;
  flat?: boolean;
  accent?: AccentPalette;
}>;

export function SectionCard({
  title,
  description,
  trailing,
  icon,
  children,
  flat = false,
  accent,
}: SectionCardProps) {
  const iconBackgroundStyle = accent ? { backgroundColor: accent.accentSoft } : null;
  const iconForegroundStyle = accent ? { color: accent.accentForeground } : null;

  const isAndroid = Platform.OS === "android";
  const elevatedStyle: ViewStyle | undefined = flat
    ? undefined
    : isAndroid
      ? { elevation: 2, shadowColor: "transparent" }
      : (shadows.soft as ViewStyle);

  return (
    <View className="gap-2.5">
      {(title || description || trailing) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View className="flex-row items-center gap-2">
              {icon ? (
                <View
                  className="h-5 w-5 items-center justify-center rounded-md bg-accent-soft"
                  style={[{ borderCurve: "continuous" }, iconBackgroundStyle as ViewStyle]}
                >
                  <Icon
                    icon={icon}
                    size={12}
                    strokeWidth={2.25}
                    className="text-accent-soft-foreground"
                    color={iconForegroundStyle?.color}
                  />
                </View>
              ) : null}
              {title ? (
                <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {title}
                </Text>
              ) : null}
            </View>
            {description ? (
              <Text className="text-sm text-muted" style={styles.description}>
                {description}
              </Text>
            ) : null}
          </View>
          {trailing}
        </View>
      )}
      <Surface
        variant={flat ? "tertiary" : "secondary"}
        className="rounded-2xl"
        style={[styles.card as ViewStyle, elevatedStyle]}
      >
        {children}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: "continuous",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  description: {
    marginTop: 2,
  },
});
