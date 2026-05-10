import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { useState } from "react";
import { Linking, Text, TextInput, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatPercent, formatShortDate } from "@/lib/format";

type Filter = "all" | "upcoming" | "dueSoon" | "overdue" | "submitted";

const filters: Filter[] = ["all", "upcoming", "dueSoon", "overdue", "submitted"];

export default function PlannerScreen() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const assignments = useQuery(api.assignments.listForViewer, {
    status: filter === "all" ? undefined : filter,
    search,
  });
  const progress = useQuery(api.assignments.getViewerProgress);
  const markViewed = useMutation(api.assignments.markViewed);
  const recordSubmission = useMutation(api.assignments.recordSubmission);

  if (!assignments || !progress) {
    return <LoadingScreen message="Loading your planner..." />;
  }

  return (
    <ScreenShell
      title="Planner"
      description="Track coursework, record submissions, and keep deadline pressure visible."
    >
      <View className="flex-row flex-wrap gap-3">
        <SectionCard title="Submission performance">
          <Text className="text-2xl font-semibold text-foreground">
            {formatPercent(progress.metrics.onTimeRate)}
          </Text>
          <Text className="text-sm text-muted">
            {progress.assignmentStateCounts.dueSoon} due soon •{" "}
            {progress.assignmentStateCounts.overdue} overdue
          </Text>
        </SectionCard>
      </View>

      <SectionCard title="Find work">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by title or course code"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <View className="flex-row flex-wrap gap-2">
          {filters.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={item === filter ? "primary" : "secondary"}
              onPress={() => {
                setFilter(item);
              }}
            >
              <Button.Label>{item === "dueSoon" ? "Due soon" : item}</Button.Label>
            </Button>
          ))}
        </View>
      </SectionCard>

      <View className="gap-3">
        {assignments.map((assignment) => (
          <SectionCard
            key={assignment.assignmentRecipientId}
            title={assignment.title}
            description={`${assignment.courseCode} • ${formatShortDate(assignment.dueAt)} • ${assignment.status}`}
          >
            {assignment.description ? (
              <Text className="text-sm text-foreground">{assignment.description}</Text>
            ) : null}
            <Text className="text-sm text-muted">
              {assignment.submittedAt
                ? `Submitted ${formatShortDate(assignment.submittedAt)}`
                : "Not submitted yet"}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <Button
                variant="secondary"
                onPress={async () => {
                  await markViewed({ assignmentRecipientId: assignment.assignmentRecipientId });
                  toast.show({ variant: "success", label: "Assignment opened" });
                  if (assignment.linkUrl) {
                    await Linking.openURL(assignment.linkUrl);
                  }
                }}
              >
                <Button.Label>{assignment.linkUrl ? "Open LMS" : "Mark viewed"}</Button.Label>
              </Button>
              {assignment.status !== "submitted" ? (
                <Button
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
        ))}
      </View>
    </ScreenShell>
  );
}
