import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

type HeaderBackgroundProps = {
  style: ViewStyle;
};

const ANDROID_HEADER_BACKGROUND = "#FFFFFF";

function AndroidHeaderBackground({ style }: HeaderBackgroundProps) {
  return (
    <View
      style={[StyleSheet.absoluteFill, style, { backgroundColor: ANDROID_HEADER_BACKGROUND }]}
    />
  );
}

export function useTabHeaderScreenOptions() {
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
    headerTransparent: false,
    headerShadowVisible: false,
    headerLargeStyle: { backgroundColor: ANDROID_HEADER_BACKGROUND },
    headerLargeTitleShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
    headerBackground: AndroidHeaderBackground as unknown as () => React.ReactNode,
  };
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
    headerTransparent: false,
    headerShadowVisible: false,
    headerLargeStyle: { backgroundColor: ANDROID_HEADER_BACKGROUND },
    headerLargeTitleShadowVisible: false,
    headerBackButtonDisplayMode: "minimal" as const,
    headerBackground: AndroidHeaderBackground as unknown as () => React.ReactNode,
  };
}
