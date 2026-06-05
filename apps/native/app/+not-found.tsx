import { Link, Stack } from "expo-router";
import { Button, Surface } from "heroui-native";
import { Text, View, type ViewStyle } from "react-native";

import { Container } from "@/components/container";
import { Icon } from "@/components/icon";
import { shadows } from "@/lib/theme";
import { Compass01Icon } from "@hugeicons/core-free-icons";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <Container>
        <View className="flex-1 items-center justify-center p-6">
          <Surface
            variant="secondary"
            className="max-w-sm items-center gap-3 p-8"
            style={
              {
                borderCurve: "continuous",
                ...shadows.soft,
              } as ViewStyle
            }
          >
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft"
              style={{ borderCurve: "continuous" }}
            >
              <Icon
                icon={Compass01Icon}
                size={24}
                strokeWidth={1.75}
                className="text-accent-soft-foreground"
              />
            </View>
            <Text className="text-lg font-semibold text-foreground">Page not found</Text>
            <Text className="max-w-[260px] text-center text-sm leading-5 text-muted">
              The page you were looking for has moved or never existed.
            </Text>
            <Link href="/home" asChild>
              <Button>
                <Button.Label>Go home</Button.Label>
              </Button>
            </Link>
          </Surface>
        </View>
      </Container>
    </>
  );
}
