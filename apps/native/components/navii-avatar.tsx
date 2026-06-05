import { createAvatar } from "@usenavii/core";
import { useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";

import { useAppTheme } from "@/contexts/app-theme-context";
import { colors } from "@/lib/theme";

type NaviiAvatarProps = {
  seed: string;
  size?: number;
  className?: string;
  style?: ViewStyle;
  /** Allow turning off the soft ring around the avatar */
  ringless?: boolean;
  /** Title used as accessible label and as the alt on the underlying svg */
  title?: string;
};

export function NaviiAvatar({
  seed,
  size = 56,
  className,
  style,
  ringless = false,
  title,
}: NaviiAvatarProps) {
  const { isDark } = useAppTheme();

  const xml = useMemo(() => {
    try {
      return createAvatar(seed, {
        size,
        title,
        background: isDark ? "solid" : "none",
      });
    } catch {
      return null;
    }
  }, [seed, size, title, isDark]);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderCurve: "continuous",
    backgroundColor: isDark ? colors.accentSoftDark : colors.accentSoftLight,
    overflow: "hidden",
    ...(ringless
      ? null
      : {
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)",
        }),
    ...style,
  };

  if (!xml) {
    return <View className={className} style={containerStyle} />;
  }

  return (
    <View className={className} style={containerStyle}>
      <SvgXml xml={xml} width="100%" height="100%" accessible accessibilityLabel={title} />
    </View>
  );
}
