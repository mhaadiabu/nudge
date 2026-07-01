import { Button, useToast } from "heroui-native";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import { SVG } from "@mhaadi/svg/react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { googleLogoSvg } from "@/assets/google-logo";
import { authClient } from "@/lib/auth-client";

const ALLOWED_DOMAIN = "upsamail.edu.gh";

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

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 64 }}>
      <View className="flex-1 px-7">
        <View className="items-start gap-2.5">
          <View
            className="h-11 w-11 items-center justify-center rounded-xl bg-neutral-900"
            style={{ borderCurve: "continuous" }}
          >
            <Text
              className="text-lg font-semibold text-white"
              style={{ includeFontPadding: false, lineHeight: 22 }}
            >
              N
            </Text>
          </View>
          <Text
            className="text-[15px] font-medium tracking-tight text-neutral-900"
            style={{ includeFontPadding: false }}
          >
            Nudge
          </Text>
        </View>

        <View className="mt-16 gap-3">
          <Text
            className="text-[34px] font-semibold leading-[1.1] tracking-tight text-neutral-900"
            style={{ includeFontPadding: false }}
          >
            Sign in to continue.
          </Text>
          <Text
            className="text-[15px] leading-6 text-neutral-500"
            style={{ includeFontPadding: false }}
          >
            Use your {ALLOWED_DOMAIN} Google account to access your assignments, timetable, and
            nudges.
          </Text>
        </View>

        <View className="flex-1" />

        <View className="gap-3" style={{ paddingBottom: insets.bottom + 32 }}>
          <Button
            size="lg"
            className="h-[52px] w-full rounded-xl bg-neutral-900"
            isDisabled={isSigningIn}
            onPress={handleSignIn}
          >
            <View className="flex-row items-center justify-center gap-2.5">
              <SVG src={googleLogoSvg} width={18} height={18} />
              <Button.Label className="text-[15px] font-medium text-white">
                {isSigningIn ? "Opening Google..." : "Continue with Google"}
              </Button.Label>
            </View>
          </Button>

          <View className="items-center pt-2">
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Only @upsamail.edu.gh accounts are allowed"
              hitSlop={8}
              disabled
              className="rounded-md px-2 py-1"
            >
              <Text className="text-[12px] text-neutral-400" style={{ includeFontPadding: false }}>
                Only @{ALLOWED_DOMAIN} accounts are allowed
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
