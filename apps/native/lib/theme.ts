import { Platform, type ViewStyle } from "react-native";

/**
 * Shadow + color tokens used by inline RN styles. These must be plain
 * values (no `var(--…)` / `oklch()`), because React Native's style
 * processor does not understand CSS custom properties or `oklch()`.
 */

export const colors = {
  // Brand
  accent: "#E5463A",
  accentDeep: "#8E2A23",
  accentGlow: "#F0A39A",

  // Soft surfaces (used as semi-transparent backdrops)
  accentSoftLight: "rgba(229, 70, 58, 0.12)",
  accentSoftDark: "rgba(229, 70, 58, 0.22)",

  // White on brand surfaces
  white12: "rgba(255, 255, 255, 0.12)",
  white15: "rgba(255, 255, 255, 0.15)",
  white18: "rgba(255, 255, 255, 0.18)",

  // Hairlines + dividers
  hairlineLight: "rgba(127, 127, 127, 0.18)",
  hairlineDark: "rgba(127, 127, 127, 0.28)",
} as const;

type Shadow = Pick<
  ViewStyle,
  "boxShadow" | "shadowColor" | "shadowOffset" | "shadowOpacity" | "shadowRadius" | "elevation"
>;

export const shadows = {
  soft: {
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.06)",
  } satisfies Shadow,
  elevated: {
    boxShadow: "0 6px 14px -4px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
  } satisfies Shadow,
  hero: {
    boxShadow: "0 16px 32px -12px rgba(142, 42, 35, 0.4), 0 4px 8px -2px rgba(142, 42, 35, 0.2)",
  } satisfies Shadow,
} as const;

/**
 * On Android, `boxShadow` requires a flat literal so RN can fall back
 * to `elevation`. We expand our shadow tokens into the legacy props so
 * they look the same on both platforms.
 */
export function expandShadow(shadow: { boxShadow?: string }): ViewStyle {
  if (Platform.OS !== "android" || !shadow.boxShadow) {
    return shadow as ViewStyle;
  }

  // Approximate the first shadow's offset/blur/opacity for elevation
  return {
    ...shadow,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  };
}
