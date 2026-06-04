import { Spinner } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

type LoadingScreenProps = {
  title?: string;
  message?: string;
};

export function LoadingScreen({
  title = "Loading Nudge",
  message = "Syncing your academic workspace...",
}: LoadingScreenProps) {
  return (
    <Container className="px-6 py-12">
      <View className="flex-1 items-center justify-center gap-3">
        <Spinner size="lg" />
        <View className="items-center gap-1">
          <Text className="text-base font-medium text-foreground">{title}</Text>
          <Text className="text-center text-sm text-muted">{message}</Text>
        </View>
      </View>
    </Container>
  );
}
