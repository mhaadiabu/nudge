import { Spinner, Surface } from "heroui-native";
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
    <Container className="px-5 py-10">
      <View className="flex-1 items-center justify-center">
        <Surface variant="secondary" className="w-full max-w-md rounded-3xl p-6">
          <View className="items-center gap-4">
            <Spinner size="lg" />
            <View className="items-center gap-1">
              <Text className="text-xl font-semibold text-foreground">{title}</Text>
              <Text className="text-center text-sm text-muted">{message}</Text>
            </View>
          </View>
        </Surface>
      </View>
    </Container>
  );
}
