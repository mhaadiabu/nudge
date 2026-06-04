import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { Linking, Text, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { MetricCard } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatDayLabel, formatPercent, formatShortDate } from "@/lib/format";

export default function DashboardScreen() {
  const { toast } = useToast();
  const viewer = useQuery(api.profiles.getViewer);
  const studentDashboard = useQuery(
    api.portal.getStudentDashboard,
    viewer?.primaryRole === "student" ? {} : "skip",
  );
  const progress = useQuery(
    api.assignments.getViewerProgress,
    viewer?.primaryRole === "student" ? {} : "skip",
  );
  const nudgeSummary = useQuery(
    api.nudges.getViewerNudgeSummary,
    viewer?.primaryRole === "student" ? {} : "skip",
  );
  const managerOverview = useQuery(
    api.portal.getManagerOverview,
    viewer && viewer.primaryRole !== "student" ? {} : "skip",
  );
  const dashboardSummary = useQuery(
    api.analytics.getDashboardSummary,
    viewer && viewer.primaryRole !== "student" ? {} : "skip",
  );
  const seedDemoData = useMutation(api.seed.seedDemoData);
  const generateNudges = useMutation(api.nudges.generateForViewer);
  const dispatchNudges = useMutation(api.nudges.dispatchDueNudges);

  if (!viewer) {
    return <LoadingScreen />;
  }

  if (viewer.primaryRole === "student" && (!studentDashboard || !progress || !nudgeSummary)) {
    return <LoadingScreen message="Gathering assignments, classes, and nudges..." />;
  }

  if (viewer.primaryRole !== "student" && (!managerOverview || !dashboardSummary)) {
    return <LoadingScreen message="Loading management intelligence..." />;
  }

  if (viewer.primaryRole === "student" && studentDashboard && progress && nudgeSummary) {
    return (
      <ScreenShell title={`Hi, ${viewer.fullName?.split(" ")[0] ?? "Student"}`}>
        <View className="flex-row flex-wrap gap-x-8 gap-y-6">
          <MetricCard
            label="Due soon"
            value={String(progress.assignmentStateCounts.dueSoon)}
            detail="Assignments"
          />
          <MetricCard
            label="On-time"
            value={formatPercent(progress.metrics.onTimeRate)}
            detail="Submissions"
          />
          <MetricCard
            label="Attendance"
            value={formatPercent(studentDashboard.attendanceSummary.attendanceRate)}
          />
          <MetricCard label="Nudge open" value={formatPercent(nudgeSummary.openRate)} />
        </View>

        <SectionCard title="Behavioral nudges">
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              onPress={async () => {
                const result = await generateNudges({ force: false });
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
                const result = await dispatchNudges({});
                toast.show({
                  variant: "success",
                  label: `Dispatched ${result.sentNow} nudges`,
                });
              }}
            >
              <Button.Label>Dispatch due</Button.Label>
            </Button>
          </View>
          <Text className="text-sm text-muted">
            Current experiment: {studentDashboard.experiment?.name ?? "No active experiment"}{" "}
            {studentDashboard.experiment?.groupName
              ? `(${studentDashboard.experiment.groupName})`
              : ""}
          </Text>
        </SectionCard>

        <SectionCard title="Upcoming assignments">
          <View className="gap-6">
            {studentDashboard.upcomingAssignments.map((assignment) => (
              <View key={assignment.assignmentId} className="gap-1.5">
                <Text className="text-base font-medium text-foreground">{assignment.title}</Text>
                <Text className="text-sm text-muted">
                  {assignment.courseCode} • {formatShortDate(assignment.dueAt)} •{" "}
                  {assignment.status}
                </Text>
                {assignment.linkUrl ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2 self-start"
                    onPress={() => {
                      void Linking.openURL(assignment.linkUrl!);
                    }}
                  >
                    <Button.Label>Open LMS link</Button.Label>
                  </Button>
                ) : null}
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Today and next">
          <View className="gap-6">
            {studentDashboard.timetable.map((event) => (
              <View key={event._id} className="gap-1">
                <Text className="text-base font-medium text-foreground">{event.title}</Text>
                <Text className="text-sm text-muted">
                  {formatDayLabel(event.startsAt)} • {event.venue ?? "Venue update pending"} •{" "}
                  {event.kind}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Announcements">
          <View className="gap-6">
            {studentDashboard.announcements.map((announcement) => (
              <View key={announcement._id} className="gap-1.5">
                <Text className="text-base font-medium text-foreground">{announcement.title}</Text>
                <Text className="text-sm text-muted">
                  {announcement.category} • {formatShortDate(announcement.publishedAt)}
                </Text>
                <Text className="text-sm leading-5 text-foreground">{announcement.body}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Pinned resources">
          <View className="gap-6">
            {studentDashboard.resources.map((resource) => (
              <View key={resource._id} className="gap-1.5">
                <Text className="text-base font-medium text-foreground">{resource.title}</Text>
                <Text className="text-sm text-muted">{resource.kind}</Text>
                <Text className="text-sm leading-5 text-foreground">{resource.description}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      </ScreenShell>
    );
  }

  const managerSnapshot = managerOverview!;
  const analyticsSnapshot = dashboardSummary!;

  return (
    <ScreenShell title={`Welcome back, ${viewer.fullName?.split(" ")[0] ?? "Manager"}`}>
      <View className="flex-row flex-wrap gap-x-8 gap-y-6">
        <MetricCard label="Students" value={String(managerSnapshot.counts.students)} />
        <MetricCard label="Courses" value={String(managerSnapshot.counts.courses)} />
        <MetricCard
          label="On-time"
          value={formatPercent(analyticsSnapshot.submissionMetrics.onTimeRate)}
          detail="Submissions"
        />
        <MetricCard
          label="Nudge open"
          value={formatPercent(analyticsSnapshot.nudgeMetrics.openRate)}
        />
      </View>

      <SectionCard title="Demo workspace">
        <Button
          className="self-start"
          onPress={async () => {
            const result = await seedDemoData({});
            toast.show({
              variant: result.seeded ? "success" : "danger",
              label: result.seeded ? "Demo data seeded" : result.message,
            });
          }}
        >
          <Button.Label>Seed pilot dataset</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard title="Latest announcements">
        <View className="gap-6">
          {managerSnapshot.latestAnnouncements.map((announcement) => (
            <View key={announcement._id} className="gap-1">
              <Text className="text-base font-medium text-foreground">{announcement.title}</Text>
              <Text className="text-sm text-muted">
                {announcement.category} • {formatShortDate(announcement.publishedAt)}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Upcoming academic events">
        <View className="gap-6">
          {managerSnapshot.upcomingEvents.map((event) => (
            <View key={event._id} className="gap-1">
              <Text className="text-base font-medium text-foreground">{event.title}</Text>
              <Text className="text-sm text-muted">
                {formatShortDate(event.startsAt)} • {event.kind}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenShell>
  );
}
