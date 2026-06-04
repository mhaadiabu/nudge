import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { useEffect, useMemo, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";

export default function SettingsScreen() {
  const { toast } = useToast();
  const settingsBundle = useQuery(api.profiles.getViewerSettings);
  const liveSurvey = useQuery(api.portal.getLiveSurvey);
  const updateConsent = useMutation(api.profiles.updateViewerConsent);
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);
  const updateSettings = useMutation(api.profiles.updateViewerSettings);
  const submitSurveyResponse = useMutation(api.portal.submitSurveyResponse);

  const [programme, setProgramme] = useState("");
  const [level, setLevel] = useState("");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("06:00");
  const [preferences, setPreferences] = useState({
    digestEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    motivationEnabled: true,
    socialNormsEnabled: true,
    commitmentEnabled: true,
    timetableRemindersEnabled: true,
    assignmentRemindersEnabled: true,
  });
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!settingsBundle) {
      return;
    }
    setProgramme(settingsBundle.profile.programme ?? "");
    setLevel(settingsBundle.profile.level ?? "");
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

  const preferenceEntries = useMemo(
    () =>
      [
        ["digestEnabled", "Digest summaries"],
        ["pushEnabled", "Push nudges"],
        ["inAppEnabled", "In-app alerts"],
        ["motivationEnabled", "Motivational nudges"],
        ["socialNormsEnabled", "Social norm cues"],
        ["commitmentEnabled", "Commitment prompts"],
        ["timetableRemindersEnabled", "Timetable reminders"],
        ["assignmentRemindersEnabled", "Assignment reminders"],
      ] as const,
    [],
  );

  if (!settingsBundle) {
    return <LoadingScreen message="Loading your preferences..." />;
  }

  return (
    <ScreenShell title="Settings">
      <SectionCard title="Profile" description={settingsBundle.profile.email}>
        <TextInput
          value={programme}
          onChangeText={setProgramme}
          placeholder="Programme"
          placeholderTextColor="#8b8b95"
          className="rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={level}
          onChangeText={setLevel}
          placeholder="Level"
          placeholderTextColor="#8b8b95"
          className="rounded-xl border border-border bg-background px-4 py-3 text-foreground"
        />
        <Button
          className="self-start"
          onPress={async () => {
            await completeOnboarding({
              programme,
              level,
              preferredReminderHour: settingsBundle.profile.preferredReminderHour ?? 18,
              timezone: settingsBundle.profile.timezone ?? "Africa/Accra",
            });
            toast.show({ variant: "success", label: "Profile updated" });
          }}
        >
          <Button.Label>Save profile</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard
        title="Consent"
        description={`Current status: ${settingsBundle.profile.consentStatus}`}
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

      <SectionCard title="Notification controls">
        <View>
          {preferenceEntries.map(([key, label], index) => (
            <View key={key}>
              {index > 0 ? <View className="h-px bg-border" /> : null}
              <View className="flex-row items-center justify-between py-3.5">
                <Text className="text-sm text-foreground">{label}</Text>
                <Switch
                  value={preferences[key]}
                  onValueChange={(value) => {
                    setPreferences((current) => ({ ...current, [key]: value }));
                  }}
                />
              </View>
            </View>
          ))}
        </View>
        <View className="mt-2 flex-row gap-3">
          <TextInput
            value={quietStart}
            onChangeText={setQuietStart}
            placeholder="Quiet start"
            placeholderTextColor="#8b8b95"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          />
          <TextInput
            value={quietEnd}
            onChangeText={setQuietEnd}
            placeholder="Quiet end"
            placeholderTextColor="#8b8b95"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground"
          />
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

      {liveSurvey ? (
        <SectionCard title={liveSurvey.title}>
          <View className="gap-6">
            {liveSurvey.questions.map((question) => (
              <View key={question.id} className="gap-2">
                <Text className="text-sm text-foreground">{question.prompt}</Text>
                <View className="flex-row gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Button
                      key={score}
                      size="sm"
                      variant={
                        surveyAnswers[question.id] === String(score) ? "primary" : "secondary"
                      }
                      onPress={() => {
                        setSurveyAnswers((current) => ({
                          ...current,
                          [question.id]: String(score),
                        }));
                      }}
                    >
                      <Button.Label>{String(score)}</Button.Label>
                    </Button>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <Button
            className="self-start"
            onPress={async () => {
              await submitSurveyResponse({
                surveyTemplateId: liveSurvey._id,
                answers: liveSurvey.questions.map((question) => ({
                  questionId: question.id,
                  value: surveyAnswers[question.id] ?? "3",
                })),
              });
              toast.show({ variant: "success", label: "Survey submitted" });
            }}
          >
            <Button.Label>Submit pulse survey</Button.Label>
          </Button>
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}
