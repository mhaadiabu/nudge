import { cn } from "heroui-native";
import { Platform, Text, View, type ViewStyle } from "react-native";

import { StatusPill } from "@/components/status-pill";
import type { IconSvgElement } from "@hugeicons/react-native";
import { Icon } from "@/components/icon";
import { shadows } from "@/lib/theme";
import type { AccentPalette } from "@/lib/role-config";

type HeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  meta: { label: string; value: string }[];
  badge?: { label: string; tone?: "accent" | "success" | "warning" | "info" };
  decoration?: IconSvgElement;
  className?: string;
  accent?: AccentPalette;
};

const FALLBACK_PALETTE: AccentPalette = {
  accent: "#E5463A",
  accentSoft: "rgba(229, 70, 58, 0.12)",
  accentSoftStrong: "rgba(229, 70, 58, 0.22)",
  accentForeground: "#E5463A",
  accentDeep: "#8E2A23",
  accentGlow: "#F0A39A",
};

function buildGradient(palette: AccentPalette): string {
  return `linear-gradient(135deg, ${palette.accentDeep} 0%, ${palette.accent} 60%, ${palette.accentDeep} 100%)`;
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  meta,
  badge,
  decoration,
  className,
  accent,
}: HeroProps) {
  const palette = accent ?? FALLBACK_PALETTE;
  const isAndroid = Platform.OS === "android";
  const containerStyle: ViewStyle = isAndroid
    ? {
        borderCurve: "continuous",
        backgroundColor: palette.accentDeep,
        elevation: 6,
        shadowColor: palette.accentDeep,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      }
    : {
        borderCurve: "continuous",
        backgroundColor: palette.accentDeep,
        backgroundImage: buildGradient(palette),
        ...(shadows.hero as ViewStyle),
      };

  return (
    <View
      className={cn("relative overflow-hidden rounded-xl p-6", className)}
      style={containerStyle}
    >
      {decoration ? (
        <View style={styles.decoration} pointerEvents="none">
          <Icon icon={decoration} size={140} strokeWidth={1.25} className="text-white" />
        </View>
      ) : null}

      <View className="gap-4">
        <View className="flex-row items-center gap-2 self-start">
          <View
            className="h-6 items-center justify-center rounded-md bg-white/15 px-2.5"
            style={{ borderCurve: "continuous" }}
          >
            <Text
              className="text-[11px] font-semibold uppercase tracking-wider text-white"
              style={{ includeFontPadding: false }}
            >
              {eyebrow}
            </Text>
          </View>
          {badge ? <StatusPill label={badge.label} tone={badge.tone ?? "accent"} /> : null}
        </View>

        <View className="gap-1.5">
          <Text
            className="text-[28px] font-semibold leading-[1.1] tracking-tight text-white"
            style={{ includeFontPadding: false }}
          >
            {title}
          </Text>
          <Text
            className="text-[15px] leading-6 text-white/85"
            numberOfLines={3}
            style={{ includeFontPadding: false }}
          >
            {subtitle}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2 self-start">
          {meta.map((item) => (
            <View
              key={item.label}
              className="flex-row items-center gap-2 rounded-xl bg-white/12 px-3 py-2"
              style={{ borderCurve: "continuous" }}
            >
              <Text
                className="text-[11px] font-semibold uppercase tracking-wider text-white/70"
                style={{ includeFontPadding: false }}
              >
                {item.label}
              </Text>
              <Text
                className="text-sm font-semibold text-white"
                style={{ includeFontPadding: false }}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles: Record<string, ViewStyle> = {
  decoration: {
    position: "absolute",
    right: -28,
    bottom: -28,
  },
};
