import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, Input, Label, TextField, useToast } from "heroui-native";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  CheckListIcon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Linking, Text, View } from "react-native";

import { FilterChip } from "@/components/filter-chip";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { formatPercent, formatShortDate } from "@/lib/format";
import { useViewer } from "@/lib/use-viewer";
import { Link } from "expo-router";

type Filter = "all" | "upcoming" | "dueSoon" | "overdue" | "submitted";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "dueSoon", label: "Due soon" },
  { value: "overdue", label: "Overdue" },
  { value: "submitted", label: "Submitted" },
];

function statusTone(status: string): "info" | "warning" | "success" | "accent" {
  if (status === "submitted") return "success";
  if (status === "overdue") return "warning";
  if (status === "dueSoon") return "info";
  return "accent";
}

function statusLabel(status: string) {
  if (status === "dueSoon") return "Due soon";
  if (status === "all") return "All";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function PlannerScreen() {
  const { toast } = useToast();
  const { isManager } = useViewer();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const assignments = useQuery(
    api.assignments.listForViewer,
    isManager
      ? "skip"
      : {
          status: filter === "all" ? undefined : filter,
          search,
        },
  );
  const progress = useQuery(api.assignments.getViewerProgress, isManager ? "skip" : {});
  const markViewed = useMutation(api.assignments.markViewed);
  const recordSubmission = useMutation(api.assignments.recordSubmission);

  if (isManager) {
    return (
      <ScreenShell>
        <SectionCard title="Student planner" icon={Calendar03Icon} flat>
          <EmptyState
            icon={Calendar03Icon}
            title="Planners are for students"
            message="As a manager, your cohort overview lives on the Insights and Team tabs."
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

  if (!assignments || !progress) {
    return <LoadingScreen message="Loading your planner..." />;
  }

  const onTimeRate = progress.metrics.onTimeRate;
  const rateTone: "success" | "warning" | "default" =
    onTimeRate >= 0.8 ? "success" : onTimeRate >= 0.5 ? "warning" : "default";

  return (
    <ScreenShell>
      <SectionCard title="On-time rate" icon={Tick02Icon}>
        <View className="flex-row items-end justify-between">
          <Text
            className={`text-[44px] font-bold tracking-tight ${
              rateTone === "success"
                ? "text-success"
                : rateTone === "warning"
                  ? "text-warning"
                  : "text-foreground"
            }`}
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {formatPercent(onTimeRate)}
          </Text>
          <View className="items-end gap-1.5">
            <View className="flex-row gap-3">
              <View className="items-end">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Due soon
                </Text>
                <Text
                  className="text-lg font-bold tabular-nums text-foreground"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {progress.assignmentStateCounts.dueSoon}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Overdue
                </Text>
                <Text
                  className={`text-lg font-bold tabular-nums ${
                    progress.assignmentStateCounts.overdue > 0 ? "text-warning" : "text-foreground"
                  }`}
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {progress.assignmentStateCounts.overdue}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Find work" icon={Search01Icon}>
        <TextField>
          <Label>Search</Label>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title or course code"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </TextField>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {filters.map((item) => (
            <FilterChip
              key={item.value}
              label={item.label}
              active={item.value === filter}
              onPress={() => {
                setFilter(item.value);
              }}
            />
          ))}
        </View>
      </SectionCard>

      {assignments.length === 0 ? (
        <SectionCard title="Results" flat>
          <EmptyState
            icon={CheckListIcon}
            title="Nothing here yet"
            message={
              filter === "all" && !search
                ? "When new assignments roll in, they'll show up here."
                : "No assignments match your current filters. Try a different combination."
            }
            tone="info"
          />
        </SectionCard>
      ) : (
        assignments.map((assignment) => (
          <SectionCard
            key={assignment.assignmentRecipientId}
            title={assignment.title}
            description={`${assignment.courseCode} · Due ${formatShortDate(assignment.dueAt)}`}
            icon={Calendar03Icon}
            flat
            trailing={
              <StatusPill
                label={statusLabel(assignment.status)}
                tone={statusTone(assignment.status)}
              />
            }
          >
            {assignment.description ? (
              <Text className="text-sm leading-5 text-foreground" numberOfLines={3}>
                {assignment.description}
              </Text>
            ) : null}
            <Text className="text-xs text-muted">
              {assignment.submittedAt
                ? `Submitted ${formatShortDate(assignment.submittedAt)}`
                : "Not submitted yet"}
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onPress={async () => {
                  await markViewed({ assignmentRecipientId: assignment.assignmentRecipientId });
                  toast.show({ variant: "success", label: "Assignment opened" });
                  if (assignment.linkUrl) {
                    await Linking.openURL(assignment.linkUrl);
                  }
                }}
              >
                <Button.Label>{assignment.linkUrl ? "Open LMS" : "Mark viewed"}</Button.Label>
                <Icon
                  icon={ArrowRight01Icon}
                  size={14}
                  strokeWidth={2.25}
                  className="text-foreground"
                />
              </Button>
              {assignment.status !== "submitted" ? (
                <Button
                  size="sm"
                  onPress={async () => {
                    await recordSubmission({ assignmentId: assignment.assignmentId });
                    toast.show({ variant: "success", label: "Submission recorded" });
                  }}
                >
                  <Button.Label>Record submission</Button.Label>
                </Button>
              ) : null}
            </View>
          </SectionCard>
        ))
      )}
    </ScreenShell>
  );
}
