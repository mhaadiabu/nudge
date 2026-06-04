import { Ionicons } from "@expo/vector-icons";
import { Button, useToast } from "heroui-native";
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
    <Container className="px-6 py-12">
      <View className="flex-1 justify-center gap-10">
        <View className="gap-3">
          <Text className="text-4xl font-semibold tracking-tight text-foreground">Nudge</Text>
          <Text className="text-base leading-6 text-muted">
            Sign in with your UPSA account to access assignments, timetable, resources, and nudges.
          </Text>
        </View>

        <View className="gap-3">
          <Button
            className="w-full"
            variant="primary"
            onPress={async () => {
              await authClient.signIn.social(
                { provider: "google", callbackURL: "/" },
                {
                  onError(error) {
                    const message = error.error?.message || "Google sign-in failed";
                    const hint = message.toLowerCase().includes("invalid")
                      ? " Check that the OAuth redirect URI is registered in Google Cloud Console."
                      : "";
                    toast.show({
                      variant: "danger",
                      label: `${message}${hint}`,
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
          <Text className="text-center text-xs text-muted">
            Only @upsamail.edu.gh accounts are allowed.
          </Text>
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-medium uppercase tracking-wider text-muted">
            Demo accounts
          </Text>
          <Text className="text-sm leading-5 text-muted">{demoAccounts.join("  •  ")}</Text>
        </View>
      </View>
    </Container>
  );
}
