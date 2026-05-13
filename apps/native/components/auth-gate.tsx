import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";

const demoAccounts = [
  "department.admin@upsa.edu.gh",
  "lecturer.johnson@upsa.edu.gh",
  "ama.ofori@upsa.edu.gh",
];

export function AuthGate() {
  return (
    <Container className="px-4 py-8">
      <View className="gap-5">
        <Surface variant="secondary" className="rounded-3xl p-6">
          <View className="gap-3">
            <Text className="text-3xl font-semibold text-foreground">Nudge</Text>
            <Text className="text-base text-muted">
              Sign in with your UPSA account to access assignments, timetable, resources, and nudges.
            </Text>
          </View>
        </Surface>

        <Surface variant="secondary" className="rounded-3xl p-5">
          <Button
            className="w-full"
            variant="primary"
            onPress={() => {
              authClient.signIn.social("google");
            }}
          >
            <Button.Label>Sign in with Google</Button.Label>
          </Button>
          <Text className="text-center text-xs text-muted mt-2">
            Only @upsamail.edu.gh accounts are allowed.
          </Text>
        </Surface>

        <Surface variant="secondary" className="rounded-3xl p-5">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Demo accounts (after seeding)</Text>
            <Text className="text-sm text-muted">{demoAccounts.join("  •  ")}</Text>
          </View>
        </Surface>
      </View>
    </Container>
  );
}