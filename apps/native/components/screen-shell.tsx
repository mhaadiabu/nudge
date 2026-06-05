import { type PropsWithChildren } from "react";
import { View } from "react-native";

import { Container } from "@/components/container";

type ScreenShellProps = PropsWithChildren<{
  contentClassName?: string;
}>;

export function ScreenShell({ children, contentClassName }: ScreenShellProps) {
  return (
    <Container
      scrollViewProps={{
        contentContainerStyle: {
          paddingHorizontal: 20,
          paddingBottom: 20,
        },
        contentInsetAdjustmentBehavior: "automatic",
      }}
    >
      <View className={contentClassName ?? "gap-6 pt-2"}>{children}</View>
    </Container>
  );
}
