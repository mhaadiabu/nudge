import { Button, Surface, useToast } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import { SVG } from "@mhaadi/svg/react-native";
import { Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { Icon } from "@/components/icon";
import { googleLogoSvg } from "@/assets/google-logo";
import { authClient } from "@/lib/auth-client";
import { shadows } from "@/lib/theme";
import {
  BookOpen01Icon,
  Calendar01Icon,
  CheckListIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

const demoAccounts = [
  "department.admin@upsa.edu.gh",
  "lecturer.johnson@upsa.edu.gh",
  "ama.ofori@upsa.edu.gh",
];

const highlights = [
  {
    icon: CheckListIcon,
    title: "Plan your work",
    description: "Assignments and deadlines, surfaced in one place.",
  },
  {
    icon: Calendar01Icon,
    title: "Stay on schedule",
    description: "Live timetable with timely reminders before each class.",
  },
  {
    icon: BookOpen01Icon,
    title: "Find your notes",
    description: "Pinned resources and course material, always within reach.",
  },
  {
    icon: SparklesIcon,
    title: "Nudges that adapt",
    description: "Behaviourally informed prompts tailored to your week.",
  },
];

export function AuthGate() {
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const inFlightRef = useRef(false);

  const handleSignIn = async () => {
    if (inFlightRef.current || isSigningIn) {
      return;
    }
    inFlightRef.current = true;
    setIsSigningIn(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        await WebBrowser.dismissAuthSession();
      } catch {}

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
          onSuccess() {
            toast.show({
              variant: "success",
              label: "Signed in successfully",
            });
          },
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-in failed unexpectedly";
      toast.show({
        variant: "danger",
        label: message,
      });
    } finally {
      try {
        await WebBrowser.dismissAuthSession();
      } catch {}
      inFlightRef.current = false;
      setIsSigningIn(false);
    }
  };

  // Hero top padding doesn't clip the status bar on notched devices. 12 is
  // a buffer above the safe-area inset so the logo never sits flush to it.
  const heroPaddingTop = insets.top + 12;

  return (
    <View className="flex-1 bg-background">
      <View
        className="accent-mesh overflow-hidden px-5 pb-14"
        style={{ paddingTop: heroPaddingTop }}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", borderCurve: "continuous" }}
          >
            <Text className="text-2xl font-bold text-white">N</Text>
          </View>
          <Text className="text-3xl font-semibold tracking-tight text-white">Nudge</Text>
        </View>
        <View className="mt-8 gap-3">
          <Text
            className="text-[30px] font-semibold leading-[1.1] tracking-tight text-balance text-white"
            numberOfLines={4}
          >
            Behavioural nudges for the students who need them.
          </Text>
          <Text className="text-base leading-6 text-white/85">
            Sign in with your UPSA account to access assignments, timetable, resources, and
            behaviourally informed nudges.
          </Text>
        </View>
      </View>

      <Container className="px-5 -mt-6">
        <View className="gap-7">
          <Surface
            variant="default"
            className="p-6"
            style={
              {
                borderCurve: "continuous",
                ...shadows.elevated,
              } as ViewStyle
            }
          >
            <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Continue with
            </Text>
            <Text className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Your UPSA account
            </Text>
            <Text className="mt-1 text-sm text-muted">
              Use your @upsamail.edu.gh Google account.
            </Text>
            <Button
              size="lg"
              className="mt-5 h-[52px] w-full"
              isDisabled={isSigningIn}
              onPress={handleSignIn}
            >
              <View className="flex-row items-center justify-center gap-3">
                <SVG src={googleLogoSvg} width={20} height={20} />
                <Button.Label>
                  {isSigningIn ? "Opening Google..." : "Continue with Google"}
                </Button.Label>
              </View>
            </Button>
            <Text className="mt-3 text-center text-xs text-muted">
              Only @upsamail.edu.gh accounts are allowed.
            </Text>
          </Surface>

          <View className="gap-4">
            <Text className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
              What you get
            </Text>
            <View className="gap-4">
              {highlights.map((item) => (
                <View key={item.title} className="flex-row items-start gap-3.5">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl bg-accent-soft"
                    style={{ borderCurve: "continuous" }}
                  >
                    <Icon
                      icon={item.icon}
                      size={18}
                      strokeWidth={2}
                      className="text-accent-soft-foreground"
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-medium text-foreground">{item.title}</Text>
                    <Text className="text-sm leading-5 text-muted">{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Demo accounts
            </Text>
            <Text
              className="px-1 text-sm leading-5 text-muted"
              numberOfLines={2}
              ellipsizeMode="middle"
            >
              {demoAccounts.join("  ·  ")}
            </Text>
          </View>
        </View>
      </Container>
    </View>
  );
}
