import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerColor = "default" | "accent" | "success" | "warning" | "danger" | string;

type SpinnerProps = {
  size?: SpinnerSize | number;
  color?: SpinnerColor;
  className?: string;
  style?: ViewStyle;
};

const SIZE_MAP: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

const COLOR_MAP: Record<string, string> = {
  default: "#E5463A",
  accent: "#E5463A",
  success: "#2FAA6C",
  warning: "#D4A017",
  danger: "#E5463A",
};

function resolveSize(size: SpinnerProps["size"]): number {
  if (typeof size === "number") {
    return size;
  }
  return SIZE_MAP[size ?? "md"];
}

function resolveColor(color: SpinnerProps["color"]): string {
  if (!color) {
    return COLOR_MAP.default;
  }
  return COLOR_MAP[color] ?? color;
}

export function Spinner({ size = "md", color, className, style }: SpinnerProps) {
  const dimension = resolveSize(size);
  const stroke = resolveColor(color);
  const borderWidth = Math.max(2, Math.round(dimension / 8));
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className={className} style={[{ width: dimension, height: dimension }, style]}>
      <Animated.View
        style={[
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            borderWidth,
            borderColor: stroke,
            borderTopColor: "transparent",
            borderCurve: "continuous",
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
