import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

type HeaderBackgroundProps = {
  style: ViewStyle;
};

const ANDROID_HEADER_BACKGROUND = "rgba(255, 255, 255, 0.96)";

function AndroidHeaderBackground({ style }: HeaderBackgroundProps) {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        style,
        { backgroundColor: ANDROID_HEADER_BACKGROUND },
      ]}
    />
  );
}

export function tabHeaderScreenOptions() {
  if (Platform.OS === "ios") {
    return {
      headerLargeTitle: true,
      headerTransparent: true,
      headerShadowVisible: false,
      headerLargeStyle: { backgroundColor: "transparent" },
      headerLargeTitleShadowVisible: false,
      headerBackButtonDisplayMode: "minimal" as const,
      headerBlurEffect: "systemMaterial" as const,
    };
  }

  return {
    headerLargeTitle: true,
    headerTransparent: true,
    headerShadowVisible: false,
    headerLargeStyle: { backgroundColor: "transparent" },
    headerLargeTitleShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
    headerBackground: AndroidHeaderBackground as unknown as () => React.ReactNode,
  };
}
