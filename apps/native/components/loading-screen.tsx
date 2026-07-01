import { Spinner } from "@/components/spinner";
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
    <Container>
      <View className="flex-1 items-center justify-center gap-5 px-6">
        <View
          className="h-14 w-14 items-center justify-center rounded-xl bg-accent-soft"
          style={{ borderCurve: "continuous" }}
        >
          <Spinner size="md" />
        </View>
        <View className="items-center gap-1.5">
          <Text className="text-base font-medium text-foreground">{title}</Text>
          <Text className="max-w-[260px] text-center text-sm leading-5 text-muted">{message}</Text>
        </View>
      </View>
    </Container>
  );
}
