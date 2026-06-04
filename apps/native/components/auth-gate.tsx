import { Ionicons } from "@expo/vector-icons";
import { Button, Surface, useToast } from "heroui-native";
import { Text, View } from "react-native";
import { withUniwind } from "uniwind";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";

const demoAccounts = [
  "department.admin@upsa.edu.gh",
  "lecturer.johnson@upsa.edu.gh",
  "ama.ofori@upsa.edu.gh",
];

const StyledIonicons = withUniwind(Ionicons);

export function AuthGate() {
  const { toast } = useToast();

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
            onPress={async () => {
              await authClient.signIn.social(
                { provider: "google", callbackURL: "/" },
                {
                  onError(error) {
                    toast.show({
                      variant: "danger",
                      label: error.error?.message || "Google sign-in failed",
                    });
                  },
                },
              );
            }}
          >
            <View className="flex-row items-center justify-center gap-2">
              <StyledIonicons name="logo-google" size={18} className="text-primary-foreground" />
              <Button.Label>Sign in with Google</Button.Label>
            </View>
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
