import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, Input, Label, Switch, TextField, useToast } from "heroui-native";
import {
  Cancel01Icon,
  Logout01Icon,
  Settings01Icon,
  Shield01Icon,
  SparklesIcon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { authClient } from "@/lib/auth-client";

type PreferenceKey =
  | "digestEnabled"
  | "pushEnabled"
  | "inAppEnabled"
  | "motivationEnabled"
  | "socialNormsEnabled"
  | "commitmentEnabled"
  | "timetableRemindersEnabled"
  | "assignmentRemindersEnabled";

type PreferenceEntry = { key: PreferenceKey; label: string; description: string };

const deliveryPreferences: PreferenceEntry[] = [
  { key: "digestEnabled", label: "Digest summaries", description: "Daily recap of what is due." },
  { key: "pushEnabled", label: "Push nudges", description: "Notifications on your device." },
  { key: "inAppEnabled", label: "In-app alerts", description: "Alerts while you are using Nudge." },
];

const contentPreferences: PreferenceEntry[] = [
  {
    key: "motivationEnabled",
    label: "Motivational nudges",
    description: "Encouragement to keep going.",
  },
  {
    key: "socialNormsEnabled",
    label: "Social norm cues",
    description: "Reminders about how your peers are doing.",
  },
  {
    key: "commitmentEnabled",
    label: "Commitment prompts",
    description: "Ask you to commit to specific goals.",
  },
  {
    key: "timetableRemindersEnabled",
    label: "Timetable reminders",
    description: "Heads-up before each class.",
  },
  {
    key: "assignmentRemindersEnabled",
    label: "Assignment reminders",
    description: "Heads-up before assignments are due.",
  },
];

type Preferences = Record<PreferenceKey, boolean>;

const defaultPreferences: Preferences = {
  digestEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  motivationEnabled: true,
  socialNormsEnabled: true,
  commitmentEnabled: true,
  timetableRemindersEnabled: true,
  assignmentRemindersEnabled: true,
};

function SwitchRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 py-3 border-t border-separator first:border-t-0">
      <View className="flex-1 gap-0.5">
        <Text className="text-base text-foreground">{label}</Text>
        <Text className="text-sm leading-5 text-muted">{description}</Text>
      </View>
      <Switch isSelected={value} onSelectedChange={onChange} />
    </View>
  );
}

export default function SettingsScreen() {
  const { toast } = useToast();
  const settingsBundle = useQuery(api.profiles.getViewerSettings);
  const updateConsent = useMutation(api.profiles.updateViewerConsent);
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);
  const updateSettings = useMutation(api.profiles.updateViewerSettings);

  const [programme, setProgramme] = useState("");
  const [level, setLevel] = useState("");
  const [programmeDraft, setProgrammeDraft] = useState("");
  const [levelDraft, setLevelDraft] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("06:00");
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  useEffect(() => {
    if (!settingsBundle) {
      return;
    }
    const nextProgramme = settingsBundle.profile.programme ?? "";
    const nextLevel = settingsBundle.profile.level ?? "";
    setProgramme(nextProgramme);
    setLevel(nextLevel);
    setProgrammeDraft(nextProgramme);
    setLevelDraft(nextLevel);
    setQuietStart(settingsBundle.settings?.quietHoursStart ?? "22:00");
    setQuietEnd(settingsBundle.settings?.quietHoursEnd ?? "06:00");
    setPreferences({
      digestEnabled: settingsBundle.settings?.digestEnabled ?? true,
      pushEnabled: settingsBundle.settings?.pushEnabled ?? true,
      inAppEnabled: settingsBundle.settings?.inAppEnabled ?? true,
      motivationEnabled: settingsBundle.settings?.motivationEnabled ?? true,
      socialNormsEnabled: settingsBundle.settings?.socialNormsEnabled ?? true,
      commitmentEnabled: settingsBundle.settings?.commitmentEnabled ?? true,
      timetableRemindersEnabled: settingsBundle.settings?.timetableRemindersEnabled ?? true,
      assignmentRemindersEnabled: settingsBundle.settings?.assignmentRemindersEnabled ?? true,
    });
  }, [settingsBundle]);

  const consentStatus = settingsBundle?.profile.consentStatus ?? "unknown";
  const consentTone = consentStatus === "granted" ? "success" : "warning";

  if (!settingsBundle) {
    return <LoadingScreen message="Loading your preferences..." />;
  }

  return (
    <ScreenShell>
      <SectionCard
        title="Profile"
        description={settingsBundle.profile.email}
        icon={User02Icon}
        flat
        trailing={
          isEditingProfile ? null : (
            <Pressable
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={() => {
                setProgrammeDraft(programme);
                setLevelDraft(level);
                setIsEditingProfile(true);
              }}
              className="rounded-md px-2 py-1 active:opacity-60"
            >
              <Text className="text-sm font-semibold text-accent">Edit</Text>
            </Pressable>
          )
        }
      >
        {isEditingProfile ? (
          <View className="gap-3">
            <TextField>
              <Label>Programme</Label>
              <Input
                value={programmeDraft}
                onChangeText={setProgrammeDraft}
                placeholder="e.g. BSc Computer Science"
              />
            </TextField>
            <TextField>
              <Label>Level</Label>
              <Input
                value={levelDraft}
                onChangeText={setLevelDraft}
                placeholder="e.g. 200"
                keyboardType="number-pad"
              />
            </TextField>
            <View className="flex-row gap-2">
              <Button
                onPress={async () => {
                  await completeOnboarding({
                    programme: programmeDraft,
                    level: levelDraft,
                    preferredReminderHour: settingsBundle.profile.preferredReminderHour ?? 18,
                    timezone: settingsBundle.profile.timezone ?? "Africa/Accra",
                  });
                  setIsEditingProfile(false);
                  toast.show({ variant: "success", label: "Profile updated" });
                }}
              >
                <Button.Label>Save profile</Button.Label>
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  setProgrammeDraft(programme);
                  setLevelDraft(level);
                  setIsEditingProfile(false);
                }}
              >
                <Icon icon={Cancel01Icon} size={16} strokeWidth={2} className="text-foreground" />
                <Button.Label>Cancel</Button.Label>
              </Button>
            </View>
          </View>
        ) : (
          <View className="gap-3.5">
            <View className="gap-1">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Programme
              </Text>
              <Text className="text-base text-foreground">{programme || "Not set"}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Level
              </Text>
              <Text className="text-base text-foreground">{level || "Not set"}</Text>
            </View>
            <View className="flex-row items-center gap-2 pt-1">
              <StatusPill label={consentStatus} tone={consentTone} />
            </View>
          </View>
        )}
      </SectionCard>

      <SectionCard
        title="Consent"
        description="Decide whether Nudge can reach you with nudges."
        icon={Shield01Icon}
        flat
      >
        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            onPress={async () => {
              await updateConsent({ granted: true });
              toast.show({ variant: "success", label: "Consent granted" });
            }}
          >
            <Button.Label>Grant consent</Button.Label>
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onPress={async () => {
              await updateConsent({ granted: false });
              toast.show({ variant: "danger", label: "Consent declined" });
            }}
          >
            <Button.Label>Decline</Button.Label>
          </Button>
        </View>
      </SectionCard>

      <SectionCard
        title="Delivery"
        description="Where nudges can reach you"
        icon={Settings01Icon}
        flat
      >
        {deliveryPreferences.map((item) => (
          <SwitchRow
            key={item.key}
            label={item.label}
            description={item.description}
            value={preferences[item.key]}
            onChange={(value) => setPreferences((current) => ({ ...current, [item.key]: value }))}
          />
        ))}
      </SectionCard>

      <SectionCard
        title="Content"
        description="What kinds of nudges you receive"
        icon={SparklesIcon}
        flat
      >
        {contentPreferences.map((item) => (
          <SwitchRow
            key={item.key}
            label={item.label}
            description={item.description}
            value={preferences[item.key]}
            onChange={(value) => setPreferences((current) => ({ ...current, [item.key]: value }))}
          />
        ))}
      </SectionCard>

      <SectionCard
        title="Quiet hours"
        description="No nudges will be sent in this window"
        icon={Settings01Icon}
        flat
      >
        <View className="flex-row gap-3">
          <TextField className="flex-1">
            <Label>Start</Label>
            <Input
              value={quietStart}
              onChangeText={setQuietStart}
              placeholder="22:00"
              keyboardType="numbers-and-punctuation"
            />
          </TextField>
          <TextField className="flex-1">
            <Label>End</Label>
            <Input
              value={quietEnd}
              onChangeText={setQuietEnd}
              placeholder="06:00"
              keyboardType="numbers-and-punctuation"
            />
          </TextField>
        </View>
        <Button
          className="self-start"
          onPress={async () => {
            await updateSettings({
              ...preferences,
              quietHoursStart: quietStart,
              quietHoursEnd: quietEnd,
            });
            toast.show({ variant: "success", label: "Notification settings saved" });
          }}
        >
          <Button.Label>Save settings</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard title="Account" flat>
        <Button
          variant="danger"
          className="self-start"
          onPress={() => {
            Alert.alert("Sign out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => {
                  void authClient.signOut();
                },
              },
            ]);
          }}
        >
          <Icon icon={Logout01Icon} size={16} strokeWidth={2} className="text-danger-foreground" />
          <Button.Label>Sign out</Button.Label>
        </Button>
      </SectionCard>
    </ScreenShell>
  );
}
