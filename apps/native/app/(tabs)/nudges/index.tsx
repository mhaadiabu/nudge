import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { BellIcon, ChartLineData01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Link } from "expo-router";
import { Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { LoadingScreen } from "@/components/loading-screen";
import { MetricGrid } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { formatPercent, formatShortDate } from "@/lib/format";
import { useViewer } from "@/lib/use-viewer";

function toneForRate(value: number): "success" | "warning" | "default" {
  if (value >= 0.6) return "success";
  if (value >= 0.3) return "warning";
  return "default";
}

function toneForStatus(status: string): "info" | "success" | "warning" | "muted" {
  if (status === "opened") return "success";
  if (status === "dispatched") return "info";
  if (status === "scheduled") return "warning";
  return "muted";
}

function labelForStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function NudgesScreen() {
  const { toast } = useToast();
  const { isManager } = useViewer();
  const nudges = useQuery(
    api.nudges.listForViewer,
    isManager ? "skip" : { includeScheduled: true },
  );
  const summary = useQuery(
    api.nudges.getViewerNudgeSummary,
    isManager ? "skip" : {},
  );
  const generate = useMutation(api.nudges.generateForViewer);
  const dispatch = useMutation(api.nudges.dispatchDueNudges);
  const markOpened = useMutation(api.nudges.markOpened);

  if (isManager) {
    return (
      <ScreenShell>
        <SectionCard title="Nudge history" icon={BellIcon} flat>
          <EmptyState
            icon={ChartLineData01Icon}
            title="Nudges live on Insights"
            message="Your personalised nudge history isn't available here. View cohort-level engagement on the Insights tab."
            tone="info"
            action={
              <Link href="/insights" asChild>
                <Button size="sm" variant="secondary">
                  <Button.Label>Open Insights</Button.Label>
                </Button>
              </Link>
            }
          />
        </SectionCard>
      </ScreenShell>
    );
  }

  if (!nudges || !summary) {
    return <LoadingScreen message="Loading your nudge history..." />;
  }

  return (
    <ScreenShell>
      <MetricGrid
        metrics={[
          { label: "Scheduled", value: String(summary.scheduledCount), icon: SparklesIcon },
          { label: "Sent", value: String(summary.sentCount), icon: BellIcon },
          {
            label: "Opened",
            value: String(summary.openedCount),
            icon: BellIcon,
            emphasis: summary.openedCount > 0 ? "success" : "default",
          },
          {
            label: "Open rate",
            value: formatPercent(summary.openRate),
            emphasis: toneForRate(summary.openRate),
          },
        ]}
      />

      <SectionCard title="Controls" icon={SparklesIcon}>
        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            onPress={async () => {
              const result = await generate({ force: false });
              toast.show({
                variant: "success",
                label: `Generated ${result.generatedCount} nudges`,
              });
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

      {nudges.length === 0 ? (
        <SectionCard title="History" icon={BellIcon} flat>
          <EmptyState
            icon={BellIcon}
            title="No nudges yet"
            message="Generate a batch above and we'll start surfacing behaviourally informed prompts here."
            tone="accent"
          />
        </SectionCard>
      ) : (
        <SectionCard title="History" icon={BellIcon} flat>
          <View className="gap-4">
            {nudges.map((nudge, index) => (
              <View
                key={nudge._id}
                className={`gap-2 ${index > 0 ? "pt-4 border-t border-separator" : ""}`}
              >
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="flex-1 text-base font-semibold text-foreground">
                    {nudge.title}
                  </Text>
                  <StatusPill
                    label={labelForStatus(nudge.deliveryStatus)}
                    tone={toneForStatus(nudge.deliveryStatus)}
                  />
                </View>
                <Text className="text-sm leading-5 text-foreground">{nudge.message}</Text>
                <Text className="text-xs text-muted">
                  {nudge.type} · {nudge.channel} · Scheduled {formatShortDate(nudge.scheduledFor)}
                  {nudge.openedAt ? ` · Opened ${formatShortDate(nudge.openedAt)}` : ""}
                </Text>
                {nudge.adaptationReason ? (
                  <Text className="text-xs italic text-muted">{nudge.adaptationReason}</Text>
                ) : null}
                {nudge.deliveryStatus !== "opened" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-1 self-start"
                    onPress={async () => {
                      await markOpened({ nudgeEventId: nudge._id });
                      toast.show({ variant: "success", label: "Nudge marked opened" });
                    }}
                  >
                    <Button.Label>Mark opened</Button.Label>
                  </Button>
                ) : null}
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </ScreenShell>
  );
}
