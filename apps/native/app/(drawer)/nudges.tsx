import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { Text, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { MetricCard } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatPercent, formatShortDate } from "@/lib/format";

export default function NudgesScreen() {
  const { toast } = useToast();
  const nudges = useQuery(api.nudges.listForViewer, { includeScheduled: true });
  const summary = useQuery(api.nudges.getViewerNudgeSummary);
  const generate = useMutation(api.nudges.generateForViewer);
  const dispatch = useMutation(api.nudges.dispatchDueNudges);
  const markOpened = useMutation(api.nudges.markOpened);

  if (!nudges || !summary) {
    return <LoadingScreen message="Loading your nudge history..." />;
  }

  return (
    <ScreenShell
      title="Nudges"
      description="See reminders, social cues, motivational prompts, and commitment nudges in one stream."
    >
      <View className="flex-row flex-wrap gap-3">
        <MetricCard label="Scheduled" value={String(summary.scheduledCount)} />
        <MetricCard label="Sent" value={String(summary.sentCount)} />
        <MetricCard label="Opened" value={String(summary.openedCount)} />
        <MetricCard label="Open rate" value={formatPercent(summary.openRate)} />
      </View>

      <SectionCard title="Controls" description="Run the deterministic nudge engine on demand.">
        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            onPress={async () => {
              const result = await generate({ force: false });
              toast.show({ variant: "success", label: `Generated ${result.generatedCount} nudges` });
            }}
          >
            <Button.Label>Generate</Button.Label>
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onPress={async () => {
              const result = await dispatch({});
              toast.show({ variant: "success", label: `Dispatched ${result.sentNow} nudges` });
            }}
          >
            <Button.Label>Dispatch due</Button.Label>
          </Button>
        </View>
      </SectionCard>

      <View className="gap-3">
        {nudges.map((nudge) => (
          <SectionCard
            key={nudge._id}
            title={nudge.title}
            description={`${nudge.type} • ${nudge.channel} • ${nudge.deliveryStatus}`}
          >
            <Text className="text-sm text-foreground">{nudge.message}</Text>
            <Text className="text-sm text-muted">
              Scheduled {formatShortDate(nudge.scheduledFor)}
              {nudge.openedAt ? ` • Opened ${formatShortDate(nudge.openedAt)}` : ""}
            </Text>
            <Text className="text-sm text-muted">{nudge.adaptationReason}</Text>
            {nudge.deliveryStatus !== "opened" ? (
              <Button
                size="sm"
                variant="secondary"
                className="self-start"
                onPress={async () => {
                  await markOpened({ nudgeEventId: nudge._id });
                  toast.show({ variant: "success", label: "Nudge marked opened" });
                }}
              >
                <Button.Label>Mark opened</Button.Label>
              </Button>
            ) : null}
          </SectionCard>
        ))}
      </View>
    </ScreenShell>
  );
}
