import { type PropsWithChildren } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

type ScreenShellProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function ScreenShell({ title, description, children }: ScreenShellProps) {
  return (
    <Container className="px-4 pb-8 pt-2">
      <View className="gap-5">
        <View className="gap-1 px-1">
          <Text className="text-3xl font-semibold text-foreground">{title}</Text>
          <Text className="text-sm leading-5 text-muted">{description}</Text>
        </View>
        {children}
      </View>
    </Container>
  );
}
