import { createAvatar } from "@usenavii/core";
import { SVG } from "@mhaadi/svg/react-native";
import { useMemo } from "react";
import { View, type ViewStyle } from "react-native";

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
  const xml = useMemo(() => {
    try {
      return createAvatar(seed, {
        size,
        title,
        background: "none",
      });
    } catch {
      return null;
    }
  }, [seed, size, title]);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderCurve: "continuous",
    backgroundColor: colors.accentSoftLight,
    overflow: "hidden",
    ...(ringless
      ? null
      : {
          borderWidth: 1,
          borderColor: "rgba(15, 23, 42, 0.06)",
        }),
    ...style,
  };

  if (!xml) {
    return <View className={className} style={containerStyle} />;
  }

  return (
    <View className={className} style={containerStyle}>
      <SVG src={xml} width={size} height={size} />
    </View>
  );
}
