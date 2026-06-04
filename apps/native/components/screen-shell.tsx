import { type PropsWithChildren } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

type ScreenShellProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function ScreenShell({ title, description, children }: ScreenShellProps) {
  return (
    <Container className="px-6 pb-16 pt-8">
      <View className="gap-10">
        <View className="gap-1.5">
          <Text className="text-3xl font-semibold tracking-tight text-foreground">{title}</Text>
          {description ? <Text className="text-sm leading-5 text-muted">{description}</Text> : null}
        </View>
        {children}
      </View>
    </Container>
  );
}
