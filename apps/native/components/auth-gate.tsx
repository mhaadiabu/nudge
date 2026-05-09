import { Button, Surface } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";

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
              UPSA&apos;s unified academic planner for assignments, timetable changes, resources,
              announcements, nudges, and pilot analytics.
            </Text>
            <View className="rounded-2xl bg-primary/10 p-4">
              <Text className="text-sm font-medium text-foreground">Demo-friendly sign-in</Text>
              <Text className="mt-1 text-sm text-muted">
                Create an account with any UPSA email. After seeding, these emails map to ready-made
                student and manager profiles:
              </Text>
              <Text className="mt-2 text-sm text-foreground">{demoAccounts.join("  •  ")}</Text>
            </View>
          </View>
        </Surface>

        <SignIn />
        <SignUp />

        <Surface variant="secondary" className="rounded-3xl p-5">
          <View className="gap-2">
            <Text className="text-base font-medium text-foreground">What&apos;s inside</Text>
            <Text className="text-sm text-muted">
              Academic dashboard, calendar, resources, assignments, attendance insight, announcements,
              behavior-aware nudges, research tracking, and management publishing tools.
            </Text>
          </View>
        </Surface>
      </View>
    </Container>
  );
}
