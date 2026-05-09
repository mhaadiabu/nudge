import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, Spinner, useToast } from "heroui-native";
import { Linking, Text, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { MetricCard } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatDayLabel, formatPercent, formatRole, formatShortDate } from "@/lib/format";

export default function DashboardScreen() {
  const { toast } = useToast();
  const viewer = useQuery(api.profiles.getViewer);
  const studentDashboard = useQuery(
    api.portal.getStudentDashboard,
    viewer?.role === "student" ? {} : "skip",
  );
  const progress = useQuery(api.assignments.getViewerProgress, viewer?.role === "student" ? {} : "skip");
  const nudgeSummary = useQuery(
    api.nudges.getViewerNudgeSummary,
    viewer?.role === "student" ? {} : "skip",
  );
  const managerOverview = useQuery(
    api.portal.getManagerOverview,
    viewer && viewer.role !== "student" ? {} : "skip",
  );
  const dashboardSummary = useQuery(
    api.analytics.getDashboardSummary,
    viewer && viewer.role !== "student" ? {} : "skip",
  );
  const seedDemoData = useMutation(api.seed.seedDemoData);
  const generateNudges = useMutation(api.nudges.generateForViewer);
  const dispatchNudges = useMutation(api.nudges.dispatchDueNudges);

  if (!viewer) {
    return <LoadingScreen />;
  }

  if (viewer.role === "student" && (!studentDashboard || !progress || !nudgeSummary)) {
    return <LoadingScreen message="Gathering assignments, classes, and nudges..." />;
  }

  if (viewer.role !== "student" && (!managerOverview || !dashboardSummary)) {
    return <LoadingScreen message="Loading management intelligence..." />;
  }

  if (viewer.role === "student" && studentDashboard && progress && nudgeSummary) {
    return (
      <ScreenShell
        title={`Hi, ${viewer.fullName?.split(" ")[0] ?? "Student"}`}
        description="Your unified academic snapshot for assignments, timetable changes, resources, and momentum."
      >
        <View className="flex-row flex-wrap gap-3">
          <MetricCard
            label="Assignments due soon"
            value={String(progress.assignmentStateCounts.dueSoon)}
            detail={`${progress.assignmentStateCounts.overdue} overdue`}
          />
          <MetricCard
            label="On-time rate"
            value={formatPercent(progress.metrics.onTimeRate)}
            detail={`${progress.metrics.avgLeadHours.toFixed(1)} average lead hours`}
          />
          <MetricCard
            label="Attendance"
            value={formatPercent(studentDashboard.attendanceSummary.attendanceRate)}
            detail={`${studentDashboard.attendanceSummary.totalSessions} tracked sessions`}
          />
          <MetricCard
            label="Nudges opened"
            value={formatPercent(nudgeSummary.openRate)}
            detail={`${nudgeSummary.openedCount}/${nudgeSummary.sentCount} opened`}
          />
        </View>

        <SectionCard
          title="Behavioral nudges"
          description="Generate the next reminder plan or dispatch nudges that are already due."
        >
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

        <SectionCard title="Upcoming assignments" description="Next work that needs attention.">
          <View className="gap-3">
            {studentDashboard.upcomingAssignments.map((assignment) => (
              <View key={assignment.assignmentId} className="rounded-2xl bg-background/50 p-3">
                <Text className="text-base font-medium text-foreground">{assignment.title}</Text>
                <Text className="mt-1 text-sm text-muted">
                  {assignment.courseCode} • {formatShortDate(assignment.dueAt)} • {assignment.status}
                </Text>
                {assignment.linkUrl ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 self-start"
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

        <SectionCard title="Today and next" description="Timetable sessions and reschedules.">
          <View className="gap-3">
            {studentDashboard.timetable.map((event) => (
              <View key={event._id} className="rounded-2xl bg-background/50 p-3">
                <Text className="text-base font-medium text-foreground">{event.title}</Text>
                <Text className="mt-1 text-sm text-muted">
                  {formatDayLabel(event.startsAt)} • {event.venue ?? "Venue update pending"} • {event.kind}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Announcements" description="Reschedules, support notices, and course updates.">
          <View className="gap-3">
            {studentDashboard.announcements.map((announcement) => (
              <View key={announcement._id} className="rounded-2xl bg-background/50 p-3">
                <Text className="text-base font-medium text-foreground">{announcement.title}</Text>
                <Text className="mt-1 text-sm text-muted">
                  {announcement.category} • {formatShortDate(announcement.publishedAt)}
                </Text>
                <Text className="mt-2 text-sm text-foreground">{announcement.body}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Pinned resources" description="Course materials and direct links.">
          <View className="gap-3">
            {studentDashboard.resources.map((resource) => (
              <View key={resource._id} className="rounded-2xl bg-background/50 p-3">
                <Text className="text-base font-medium text-foreground">{resource.title}</Text>
                <Text className="mt-1 text-sm text-muted">{resource.kind}</Text>
                <Text className="mt-2 text-sm text-foreground">{resource.description}</Text>
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
    <ScreenShell
      title={`Welcome back, ${viewer.fullName?.split(" ")[0] ?? "Manager"}`}
      description={`Role: ${formatRole(viewer.role)}. Publish content, monitor the pilot, and keep the academic flow accurate.`}
    >
      <View className="flex-row flex-wrap gap-3">
        <MetricCard label="Students" value={String(managerSnapshot.counts.students)} />
        <MetricCard label="Courses" value={String(managerSnapshot.counts.courses)} />
        <MetricCard
          label="On-time rate"
          value={formatPercent(analyticsSnapshot.submissionMetrics.onTimeRate)}
          detail={`${analyticsSnapshot.studentCount} learners in sample`}
        />
        <MetricCard
          label="Nudge open rate"
          value={formatPercent(analyticsSnapshot.nudgeMetrics.openRate)}
          detail={`${analyticsSnapshot.nudgeMetrics.sentCount} sent`}
        />
      </View>

      <SectionCard title="Demo workspace" description="Seed the proposal-backed academic pilot data if the workspace is still empty.">
        <Button
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

        <SectionCard title="Latest announcements" description="What learners and staff see first.">
          <View className="gap-3">
          {managerSnapshot.latestAnnouncements.map((announcement) => (
            <View key={announcement._id} className="rounded-2xl bg-background/50 p-3">
              <Text className="text-base font-medium text-foreground">{announcement.title}</Text>
              <Text className="mt-1 text-sm text-muted">
                {announcement.category} • {formatShortDate(announcement.publishedAt)}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Upcoming academic events" description="Near-term timetable items and reschedules.">
        <View className="gap-3">
          {managerSnapshot.upcomingEvents.map((event) => (
            <View key={event._id} className="rounded-2xl bg-background/50 p-3">
              <Text className="text-base font-medium text-foreground">{event.title}</Text>
              <Text className="mt-1 text-sm text-muted">
                {formatShortDate(event.startsAt)} • {event.kind}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenShell>
  );
}
