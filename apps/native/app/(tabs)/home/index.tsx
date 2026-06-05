import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { Link } from "expo-router";
import {
  ArrowRight01Icon,
  BellIcon,
  BookOpen01Icon,
  Briefcase01Icon,
  Calendar01Icon,
  CheckListIcon,
  Clock01Icon,
  Database01Icon,
  Megaphone01Icon,
  SparklesIcon,
  Tick02Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { Linking, Text, View } from "react-native";

import { Hero } from "@/components/hero";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { MetricGrid } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { formatDayLabel, formatPercent, formatShortDate } from "@/lib/format";
import { useViewer } from "@/lib/use-viewer";
import { ROLE_CONFIGS } from "@/lib/role-config";

function emphasisForPercent(value: number): "success" | "warning" | "default" {
  if (value >= 0.8) return "success";
  if (value >= 0.5) return "warning";
  return "default";
}

function StudentDashboard() {
  const { toast } = useToast();
  const { firstName, config } = useViewer();
  const studentDashboard = useQuery(api.portal.getStudentDashboard);
  const progress = useQuery(api.assignments.getViewerProgress);
  const nudgeSummary = useQuery(api.nudges.getViewerNudgeSummary);
  const generateNudges = useMutation(api.nudges.generateForViewer);
  const dispatchNudges = useMutation(api.nudges.dispatchDueNudges);

  if (!studentDashboard || !progress || !nudgeSummary) {
    return <LoadingScreen message="Gathering assignments, classes, and nudges..." />;
  }

  const upcoming = studentDashboard.upcomingAssignments;
  const timetable = studentDashboard.timetable;
  const announcements = studentDashboard.announcements;
  const resources = studentDashboard.resources;
  const hasActivity = upcoming.length > 0 || timetable.length > 0;
  const heroCopy = ROLE_CONFIGS.student.hero;

  return (
    <ScreenShell>
      <Hero
        eyebrow={studentDashboard.experiment?.name ?? heroCopy.eyebrow}
        title={heroCopy.title(firstName || "Student")}
        subtitle={
          hasActivity
            ? `You have ${progress.assignmentStateCounts.dueSoon} assignments due soon and ${
                studentDashboard.timetable[0]
                  ? `your next class is ${studentDashboard.timetable[0].title}.`
                  : "your next class is coming up."
              }`
            : "You're all caught up. We'll nudge you when something needs your attention."
        }
        meta={[
          { label: "On-time", value: formatPercent(progress.metrics.onTimeRate) },
          {
            label: "Attendance",
            value: formatPercent(studentDashboard.attendanceSummary.attendanceRate),
          },
        ]}
        decoration={heroCopy.decoration}
        accent={config.palette}
      />

      <MetricGrid
        metrics={[
          {
            label: "Due soon",
            value: String(progress.assignmentStateCounts.dueSoon),
            detail: "Assignments",
            icon: CheckListIcon,
          },
          {
            label: "On-time",
            value: formatPercent(progress.metrics.onTimeRate),
            detail: "Submissions",
            icon: Tick02Icon,
            emphasis: emphasisForPercent(progress.metrics.onTimeRate),
          },
          {
            label: "Attendance",
            value: formatPercent(studentDashboard.attendanceSummary.attendanceRate),
            icon: Calendar01Icon,
            emphasis: emphasisForPercent(studentDashboard.attendanceSummary.attendanceRate),
          },
          {
            label: "Nudge open",
            value: formatPercent(nudgeSummary.openRate),
            icon: BellIcon,
            emphasis: emphasisForPercent(nudgeSummary.openRate),
          },
        ]}
      />

      <SectionCard
        title="Nudge controls"
        description={
          studentDashboard.experiment
            ? `${studentDashboard.experiment.name}${
                studentDashboard.experiment.groupName
                  ? ` · ${studentDashboard.experiment.groupName}`
                  : ""
              }`
            : "No active experiment"
        }
        icon={SparklesIcon}
        accent={config.palette}
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
      </SectionCard>

      {upcoming.length > 0 ? (
        <SectionCard
          title="Upcoming assignments"
          description={`${upcoming.length} on your radar`}
          icon={CheckListIcon}
          flat
        >
          <View className="gap-4">
            {upcoming.map((assignment, index) => (
              <View
                key={assignment.assignmentId}
                className={`gap-1.5 ${index > 0 ? "pt-4 border-t border-separator" : ""}`}
              >
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="flex-1 text-base font-semibold text-foreground">
                    {assignment.title}
                  </Text>
                  <StatusPill
                    label={assignment.status}
                    tone={
                      assignment.status === "overdue"
                        ? "warning"
                        : assignment.status === "submitted"
                          ? "success"
                          : "info"
                    }
                  />
                </View>
                <Text className="text-sm text-muted">
                  {assignment.courseCode} · Due {formatShortDate(assignment.dueAt)}
                </Text>
                {assignment.linkUrl ? (
                  <Button
                    size="sm"
                    variant="tertiary"
                    className="mt-1 self-start"
                    onPress={() => {
                      void Linking.openURL(assignment.linkUrl!);
                    }}
                  >
                    <Button.Label>Open LMS link</Button.Label>
                    <Icon
                      icon={ArrowRight01Icon}
                      size={14}
                      strokeWidth={2.25}
                      className="text-foreground"
                    />
                  </Button>
                ) : null}
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {timetable.length > 0 ? (
        <SectionCard title="Today and next" icon={Calendar01Icon} flat>
          <View className="gap-3.5">
            {timetable.map((event, index) => (
              <View
                key={event._id}
                className={`flex-row items-start gap-3 ${
                  index > 0 ? "pt-3.5 border-t border-separator" : ""
                }`}
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl bg-info-soft"
                  style={{ borderCurve: "continuous" }}
                >
                  <Icon
                    icon={Clock01Icon}
                    size={16}
                    strokeWidth={2}
                    className="text-info-soft-foreground"
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-foreground">{event.title}</Text>
                  <Text className="text-xs text-muted">
                    {formatDayLabel(event.startsAt)} · {event.venue ?? "Venue update pending"} ·{" "}
                    {event.kind}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {announcements.length > 0 ? (
        <SectionCard
          title="Announcements"
          icon={Megaphone01Icon}
          flat
          trailing={
            <Link href="/more/announcements" asChild>
              <Button size="sm" variant="ghost">
                <Button.Label>See all</Button.Label>
              </Button>
            </Link>
          }
        >
          <View className="gap-4">
            {announcements.slice(0, 3).map((announcement, index) => (
              <View
                key={announcement._id}
                className={`gap-1.5 ${index > 0 ? "pt-4 border-t border-separator" : ""}`}
              >
                <Text className="text-base font-semibold text-foreground">
                  {announcement.title}
                </Text>
                <Text className="text-xs text-muted">
                  {announcement.category} · {formatShortDate(announcement.publishedAt)}
                </Text>
                <Text className="text-sm leading-5 text-foreground" numberOfLines={3}>
                  {announcement.body}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {resources.length > 0 ? (
        <SectionCard title="Pinned resources" icon={BookOpen01Icon} flat>
          <View className="gap-4">
            {resources.slice(0, 3).map((resource, index) => (
              <View
                key={resource._id}
                className={`gap-1.5 ${index > 0 ? "pt-4 border-t border-separator" : ""}`}
              >
                <Text className="text-base font-semibold text-foreground">{resource.title}</Text>
                <Text className="text-xs text-muted">{resource.kind}</Text>
                {resource.description ? (
                  <Text className="text-sm leading-5 text-foreground" numberOfLines={2}>
                    {resource.description}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}

function ManagerDashboard() {
  const { toast } = useToast();
  const { firstName, config } = useViewer();
  const managerOverview = useQuery(api.portal.getManagerOverview, {});
  const dashboardSummary = useQuery(api.analytics.getDashboardSummary, {});
  const readiness = useQuery(api.sources.getPhaseZeroReadiness, {});
  const seedDemoData = useMutation(api.seed.seedDemoData);
  const heroCopy = config.hero;

  if (!managerOverview || !dashboardSummary || !readiness) {
    return <LoadingScreen message="Loading management intelligence..." />;
  }

  return (
    <ScreenShell>
      <Hero
        eyebrow={heroCopy.eyebrow}
        title={heroCopy.title(firstName || "Manager")}
        subtitle={`${managerOverview.counts.students} ${config.plural} and ${managerOverview.counts.courses} courses are under your watch this week.`}
        meta={[
          {
            label: "On-time",
            value: formatPercent(dashboardSummary.submissionMetrics.onTimeRate),
          },
          {
            label: "Nudge open",
            value: formatPercent(dashboardSummary.nudgeMetrics.openRate),
          },
        ]}
        decoration={heroCopy.decoration}
        accent={config.palette}
      />

      <MetricGrid
        metrics={[
          {
            label: "Students",
            value: String(managerOverview.counts.students),
            icon: UserMultipleIcon,
          },
          {
            label: "Courses",
            value: String(managerOverview.counts.courses),
            icon: BookOpen01Icon,
          },
          {
            label: "On-time",
            value: formatPercent(dashboardSummary.submissionMetrics.onTimeRate),
            detail: "Submissions",
            icon: Tick02Icon,
            emphasis: emphasisForPercent(dashboardSummary.submissionMetrics.onTimeRate),
          },
          {
            label: "Nudge open",
            value: formatPercent(dashboardSummary.nudgeMetrics.openRate),
            icon: BellIcon,
            emphasis: emphasisForPercent(dashboardSummary.nudgeMetrics.openRate),
          },
        ]}
      />

      <SectionCard
        title="Pilot readiness"
        description={
          readiness.isReady
            ? "All core data feeds confirmed."
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
        <Button
          className="self-start"
          onPress={async () => {
            const result = await seedDemoData({});
            toast.show({
              variant: result.seeded ? "success" : "danger",
              label: result.seeded ? "Pilot data seeded" : result.message,
            });
          }}
        >
          <Button.Label>Seed pilot data</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard title="Quick actions" icon={Briefcase01Icon} flat>
        <View className="flex-row flex-wrap gap-2">
          <Link href="/more/management" asChild>
            <Button size="sm" variant="secondary">
              <Button.Label>Open management console</Button.Label>
            </Button>
          </Link>
          <Link href="/team" asChild>
            <Button size="sm" variant="secondary">
              <Button.Label>Browse team</Button.Label>
            </Button>
          </Link>
          <Link href="/insights" asChild>
            <Button size="sm" variant="secondary">
              <Button.Label>View insights</Button.Label>
            </Button>
          </Link>
        </View>
      </SectionCard>

      {managerOverview.latestAnnouncements.length > 0 ? (
        <SectionCard
          title="Latest announcements"
          icon={Megaphone01Icon}
          flat
          trailing={
            <Link href="/more/announcements" asChild>
              <Button size="sm" variant="ghost">
                <Button.Label>See all</Button.Label>
              </Button>
            </Link>
          }
        >
          <View className="gap-4">
            {managerOverview.latestAnnouncements.map((announcement, index) => (
              <View
                key={announcement._id}
                className={`gap-1 ${index > 0 ? "pt-4 border-t border-separator" : ""}`}
              >
                <Text className="text-base font-semibold text-foreground">
                  {announcement.title}
                </Text>
                <Text className="text-xs text-muted">
                  {announcement.category} · {formatShortDate(announcement.publishedAt)}
                </Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {managerOverview.upcomingEvents.length > 0 ? (
        <SectionCard title="Upcoming academic events" icon={Calendar01Icon} flat>
          <View className="gap-3.5">
            {managerOverview.upcomingEvents.map((event, index) => (
              <View
                key={event._id}
                className={`flex-row items-start gap-3 ${
                  index > 0 ? "pt-3.5 border-t border-separator" : ""
                }`}
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl bg-info-soft"
                  style={{ borderCurve: "continuous" }}
                >
                  <Icon
                    icon={Clock01Icon}
                    size={16}
                    strokeWidth={2}
                    className="text-info-soft-foreground"
                  />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-foreground">{event.title}</Text>
                  <Text className="text-xs text-muted">
                    {formatShortDate(event.startsAt)} · {event.kind}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}

export default function DashboardScreen() {
  const { isLoading, isMissing, isManager } = useViewer();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isMissing) {
    return <LoadingScreen message="Preparing your workspace..." />;
  }

  return isManager ? <ManagerDashboard /> : <StudentDashboard />;
}
