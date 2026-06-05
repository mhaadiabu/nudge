import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Activity01Icon,
  ChartLineData01Icon,
  Database01Icon,
  FlaskConicalIcon,
  SparklesIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { MetricGrid } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { formatPercent, formatShortDate } from "@/lib/format";
import { useViewer } from "@/lib/use-viewer";

function toneForPercent(value: number): "success" | "warning" | "default" {
  if (value >= 0.8) return "success";
  if (value >= 0.5) return "warning";
  return "default";
}

function toneForOpenRate(value: number): "success" | "warning" | "default" {
  if (value >= 0.6) return "success";
  if (value >= 0.3) return "warning";
  return "default";
}

export default function InsightsScreen() {
  const { isManager } = useViewer();
  const summary = useQuery(api.analytics.getDashboardSummary, isManager ? {} : "skip");
  const timeline = useQuery(api.analytics.getBehaviorTimeline, isManager ? {} : "skip");
  const readiness = useQuery(api.sources.getPhaseZeroReadiness, isManager ? {} : "skip");
  const experiments = useQuery(
    api.experiments.listExperiments,
    isManager ? {} : "skip",
  );
  const activityLog = useQuery(
    api.analytics.listActivityLog,
    isManager ? { limit: 8 } : "skip",
  );

  if (!isManager) {
    return (
      <ScreenShell>
        <SectionCard title="Manager only" flat>
          <EmptyState
            icon={ChartLineData01Icon}
            title="Insights are for managers"
            message="Sign in with a manager account to view pilot performance."
            tone="info"
          />
        </SectionCard>
      </ScreenShell>
    );
  }

  if (!summary || !timeline || !readiness || !experiments || !activityLog) {
    return <LoadingScreen message="Crunching pilot numbers..." />;
  }

  const { submissionMetrics, nudgeMetrics, studentCount } = summary;
  const runningExperiments = experiments.filter((exp) => exp.status === "running");
  const draftExperiments = experiments.filter((exp) => exp.status !== "running");

  return (
    <ScreenShell>
      <MetricGrid
        metrics={[
          {
            label: "Students",
            value: String(studentCount),
            icon: ChartLineData01Icon,
          },
          {
            label: "On-time",
            value: formatPercent(submissionMetrics.onTimeRate),
            detail: "Submissions",
            icon: Tick02Icon,
            emphasis: toneForPercent(submissionMetrics.onTimeRate),
          },
          {
            label: "Nudge open",
            value: formatPercent(nudgeMetrics.openRate),
            detail: "Engagement",
            icon: SparklesIcon,
            emphasis: toneForOpenRate(nudgeMetrics.openRate),
          },
          {
            label: "Running",
            value: String(runningExperiments.length),
            detail: "Experiments",
            icon: FlaskConicalIcon,
            emphasis: runningExperiments.length > 0 ? "accent" : "default",
          },
        ]}
      />

      <SectionCard
        title="Pilot readiness"
        description={
          readiness.isReady
            ? "All data feeds confirmed."
            : "Some data feeds still need confirmation."
        }
        icon={Database01Icon}
        flat
        trailing={
          <StatusPill
            label={readiness.isReady ? "Ready" : "Pending"}
            tone={readiness.isReady ? "success" : "warning"}
          />
        }
      >
        <View className="flex-row flex-wrap gap-2">
          <StatusPill
            label={`Assignments: ${readiness.hasAssignmentSource ? "ok" : "missing"}`}
            tone={readiness.hasAssignmentSource ? "success" : "warning"}
          />
          <StatusPill
            label={`Submissions: ${readiness.hasSubmissionSource ? "ok" : "missing"}`}
            tone={readiness.hasSubmissionSource ? "success" : "warning"}
          />
          <StatusPill
            label={`Timetable: ${readiness.hasTimetableSource ? "ok" : "missing"}`}
            tone={readiness.hasTimetableSource ? "success" : "warning"}
          />
        </View>
      </SectionCard>

      {timeline.length > 0 ? (
        <SectionCard title="Behaviour over time" icon={ChartLineData01Icon} flat>
          <View className="gap-3.5">
            {timeline.slice(-4).map((row, index) => {
              const onTimeTone = toneForPercent(row.onTimeRate);
              return (
                <View
                  key={row.period}
                  className={`flex-row items-center gap-3 ${
                    index > 0 ? "pt-3.5 border-t border-separator" : ""
                  }`}
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-xl bg-info-soft"
                    style={{ borderCurve: "continuous" }}
                  >
                    <Icon
                      icon={ChartLineData01Icon}
                      size={16}
                      strokeWidth={2}
                      className="text-info-soft-foreground"
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-foreground">{row.period}</Text>
                    <Text className="text-xs text-muted">
                      {row.submissions} submissions · {row.nudgesSent} nudges sent
                    </Text>
                  </View>
                  <Text
                    className={`text-sm font-semibold ${
                      onTimeTone === "success"
                        ? "text-success"
                        : onTimeTone === "warning"
                          ? "text-warning"
                          : "text-foreground"
                    }`}
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatPercent(row.onTimeRate)}
                  </Text>
                </View>
              );
            })}
          </View>
        </SectionCard>
      ) : null}

      {runningExperiments.length > 0 || draftExperiments.length > 0 ? (
        <SectionCard
          title={`Experiments (${experiments.length})`}
          icon={FlaskConicalIcon}
          flat
        >
          <View className="gap-3.5">
            {experiments.slice(0, 5).map((experiment, index) => (
              <View
                key={experiment._id}
                className={`flex-row items-start gap-3 ${
                  index > 0 ? "pt-3.5 border-t border-separator" : ""
                }`}
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl bg-accent-soft"
                  style={{ borderCurve: "continuous" }}
                >
                  <Icon
                    icon={FlaskConicalIcon}
                    size={16}
                    strokeWidth={2}
                    className="text-accent-soft-foreground"
                  />
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="flex-1 text-sm font-semibold text-foreground">
                      {experiment.name}
                    </Text>
                    <StatusPill
                      label={experiment.status}
                      tone={experiment.status === "running" ? "success" : "muted"}
                    />
                  </View>
                  <Text className="text-xs text-muted">
                    {experiment.participantCount} participants
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {nudgeMetrics.byType.length > 0 ? (
        <SectionCard title="Nudge performance" icon={SparklesIcon} flat>
          <View className="gap-3">
            {nudgeMetrics.byType.slice(0, 5).map((entry, index) => (
              <View
                key={entry.type}
                className={`flex-row items-center gap-3 ${
                  index > 0 ? "pt-3 border-t border-separator" : ""
                }`}
              >
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-medium text-foreground">
                    {entry.type.replace(/-/g, " ")}
                  </Text>
                  <Text className="text-xs text-muted">
                    {entry.sent} sent · {entry.opened} opened
                  </Text>
                </View>
                <Text
                  className={`text-sm font-semibold ${
                    toneForOpenRate(entry.openRate) === "success"
                      ? "text-success"
                      : toneForOpenRate(entry.openRate) === "warning"
                        ? "text-warning"
                        : "text-foreground"
                  }`}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatPercent(entry.openRate)}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      <SectionCard title="Recent activity" icon={Activity01Icon} flat>
        {activityLog.length === 0 ? (
          <EmptyState
            icon={Activity01Icon}
            title="Quiet for now"
            message="Activity will appear here as soon as students and managers take action."
            tone="info"
          />
        ) : (
          <View className="gap-3">
            {activityLog.map((event, index) => (
              <View
                key={event._id}
                className={`flex-row items-start gap-3 ${
                  index > 0 ? "pt-3 border-t border-separator" : ""
                }`}
              >
                <View className="h-1.5 w-1.5 mt-2 rounded-full bg-muted" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-medium text-foreground">
                    {event.eventType.replace(/_/g, " ")}
                  </Text>
                  <Text className="text-xs text-muted">
                    {formatShortDate(event.eventAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </SectionCard>
    </ScreenShell>
  );
}
