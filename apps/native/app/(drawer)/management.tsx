import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, useToast } from "heroui-native";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { MetricCard } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { formatPercent, formatRole, formatShortDate } from "@/lib/format";

const sharedAudience = [
  "student",
  "lecturer",
  "classRep",
  "departmentAdmin",
  "researcher",
] as const;

export default function ManagementScreen() {
  const { toast } = useToast();
  const viewer = useQuery(api.profiles.getViewer);
  const overview = useQuery(
    api.portal.getManagerOverview,
    viewer?.role !== "student" ? {} : "skip",
  );
  const readiness = useQuery(
    api.sources.getPhaseZeroReadiness,
    viewer?.role !== "student" ? {} : "skip",
  );
  const summary = useQuery(
    api.analytics.getDashboardSummary,
    viewer?.role !== "student" ? {} : "skip",
  );
  const activityLog = useQuery(
    api.analytics.listActivityLog,
    viewer?.role !== "student" ? { limit: 10 } : "skip",
  );
  const people = useQuery(api.profiles.listPeople, viewer?.role !== "student" ? {} : "skip");
  const experiments = useQuery(
    api.experiments.listExperiments,
    viewer?.role !== "student" ? {} : "skip",
  );
  const strategies = useQuery(
    api.experiments.listStrategies,
    viewer?.role !== "student" ? {} : "skip",
  );

  const seedDemoData = useMutation(api.seed.seedDemoData);
  const createAnnouncement = useMutation(api.portal.createAnnouncement);
  const createResource = useMutation(api.portal.createResource);
  const createTimetableEvent = useMutation(api.portal.createTimetableEvent);
  const createAssignment = useMutation(api.assignments.createForCourse);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementCourseCode, setAnnouncementCourseCode] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceCourseCode, setResourceCourseCode] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventCourseCode, setEventCourseCode] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventHoursFromNow, setEventHoursFromNow] = useState("24");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentCourseCode, setAssignmentCourseCode] = useState("");
  const [assignmentDueHours, setAssignmentDueHours] = useState("48");

  if (!viewer) {
    return <LoadingScreen />;
  }

  if (viewer.role === "student") {
    return (
      <ScreenShell
        title="Management"
        description="This workspace is available to lecturers, class reps, administrators, and research leads."
      >
        <SectionCard title="Access required">
          <Text className="text-sm text-muted">
            Sign in with a manager account such as department.admin@upsa.edu.gh after seeding the
            demo workspace.
          </Text>
        </SectionCard>
      </ScreenShell>
    );
  }

  if (
    !overview ||
    !readiness ||
    !summary ||
    !activityLog ||
    !people ||
    !experiments ||
    !strategies
  ) {
    return <LoadingScreen message="Loading management tools..." />;
  }

  const managerOverview = overview;
  const readinessOverview = readiness;
  const analyticsSummary = summary;

  return (
    <ScreenShell
      title="Management"
      description="Publish content, seed the workspace, and monitor academic + behavioral pilot outcomes."
    >
      <View className="flex-row flex-wrap gap-3">
        <MetricCard label="Students" value={String(managerOverview.counts.students)} />
        <MetricCard label="Managers" value={String(managerOverview.counts.managers)} />
        <MetricCard
          label="On-time rate"
          value={formatPercent(analyticsSummary.submissionMetrics.onTimeRate)}
        />
        <MetricCard
          label="Nudge open rate"
          value={formatPercent(analyticsSummary.nudgeMetrics.openRate)}
        />
      </View>

      <SectionCard title="Pilot readiness">
        <Text className="text-sm text-foreground">
          {readinessOverview.isReady
            ? "All core data feeds confirmed."
            : "Some data feeds still need confirmation."}
        </Text>
        <Text className="text-sm text-muted">
          Assignments: {String(readinessOverview.hasAssignmentSource)} • Submissions:{" "}
          {String(readinessOverview.hasSubmissionSource)} • Timetable:{" "}
          {String(readinessOverview.hasTimetableSource)}
        </Text>
        <Button
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

      <SectionCard title="Publish announcement">
        <TextInput
          value={announcementTitle}
          onChangeText={setAnnouncementTitle}
          placeholder="Announcement title"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={announcementCourseCode}
          onChangeText={setAnnouncementCourseCode}
          placeholder="Course code (optional)"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={announcementBody}
          onChangeText={setAnnouncementBody}
          placeholder="Announcement body"
          placeholderTextColor="#8b8b95"
          multiline
          className="min-h-24 rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <Button
          onPress={async () => {
            await createAnnouncement({
              courseCode: announcementCourseCode || undefined,
              title: announcementTitle,
              body: announcementBody,
              category: "general",
              audienceRoles: [...sharedAudience],
              linkUrl: undefined,
            });
            setAnnouncementTitle("");
            setAnnouncementCourseCode("");
            setAnnouncementBody("");
            toast.show({ variant: "success", label: "Announcement published" });
          }}
        >
          <Button.Label>Publish</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard title="Publish resource">
        <TextInput
          value={resourceTitle}
          onChangeText={setResourceTitle}
          placeholder="Resource title"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={resourceCourseCode}
          onChangeText={setResourceCourseCode}
          placeholder="Course code (optional)"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={resourceUrl}
          onChangeText={setResourceUrl}
          placeholder="https://..."
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <Button
          onPress={async () => {
            await createResource({
              courseCode: resourceCourseCode || undefined,
              title: resourceTitle,
              description: "Shared from the management console.",
              kind: "link",
              url: resourceUrl,
              audienceRoles: [...sharedAudience],
              isPinned: true,
            });
            setResourceTitle("");
            setResourceCourseCode("");
            setResourceUrl("");
            toast.show({ variant: "success", label: "Resource published" });
          }}
        >
          <Button.Label>Add resource</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard title="Schedule event">
        <TextInput
          value={eventTitle}
          onChangeText={setEventTitle}
          placeholder="Event title"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={eventCourseCode}
          onChangeText={setEventCourseCode}
          placeholder="Course code (optional)"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={eventVenue}
          onChangeText={setEventVenue}
          placeholder="Venue"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={eventHoursFromNow}
          onChangeText={setEventHoursFromNow}
          placeholder="Hours from now"
          placeholderTextColor="#8b8b95"
          keyboardType="numeric"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <Button
          onPress={async () => {
            const startsAt = Date.now() + Number(eventHoursFromNow || "24") * 60 * 60 * 1000;
            await createTimetableEvent({
              courseCode: eventCourseCode || undefined,
              title: eventTitle,
              description: "Added from the management console.",
              startsAt,
              endsAt: startsAt + 2 * 60 * 60 * 1000,
              venue: eventVenue,
              kind: "event",
              audienceRoles: [...sharedAudience],
              isRescheduled: false,
              originalStartsAt: undefined,
            });
            setEventTitle("");
            setEventCourseCode("");
            setEventVenue("");
            setEventHoursFromNow("24");
            toast.show({ variant: "success", label: "Event scheduled" });
          }}
        >
          <Button.Label>Create event</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard title="Create assignment">
        <TextInput
          value={assignmentTitle}
          onChangeText={setAssignmentTitle}
          placeholder="Assignment title"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={assignmentCourseCode}
          onChangeText={setAssignmentCourseCode}
          placeholder="Course code"
          placeholderTextColor="#8b8b95"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <TextInput
          value={assignmentDueHours}
          onChangeText={setAssignmentDueHours}
          placeholder="Hours until due"
          placeholderTextColor="#8b8b95"
          keyboardType="numeric"
          className="rounded-2xl bg-background px-4 py-3 text-foreground"
        />
        <Button
          onPress={async () => {
            await createAssignment({
              courseCode: assignmentCourseCode,
              title: assignmentTitle,
              description: "Created from the management console.",
              dueAt: Date.now() + Number(assignmentDueHours || "48") * 60 * 60 * 1000,
              weight: 10,
              linkUrl: undefined,
            });
            setAssignmentTitle("");
            setAssignmentCourseCode("");
            setAssignmentDueHours("48");
            toast.show({ variant: "success", label: "Assignment created" });
          }}
        >
          <Button.Label>Create assignment</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard title="People" description="Current seeded and live app identities.">
        <View className="gap-2">
          {people.slice(0, 8).map((person) => (
            <View key={person._id} className="rounded-2xl bg-background/50 p-3">
              <Text className="text-sm font-medium text-foreground">
                {person.fullName ?? person.email}
              </Text>
              <Text className="text-sm text-muted">
                {formatRole(person.role)} • {person.studentId ?? person.email}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Experiments and strategies">
        <Text className="text-sm text-muted">
          {experiments.length} experiments • {strategies.length} strategies
        </Text>
        <View className="gap-2">
          {experiments.slice(0, 4).map((experiment) => (
            <View key={experiment._id} className="rounded-2xl bg-background/50 p-3">
              <Text className="text-sm font-medium text-foreground">{experiment.name}</Text>
              <Text className="text-sm text-muted">
                {experiment.status} • {experiment.participantCount} participants
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Recent activity">
        <View className="gap-2">
          {activityLog.map((event) => (
            <View key={event._id} className="rounded-2xl bg-background/50 p-3">
              <Text className="text-sm font-medium text-foreground">{event.eventType}</Text>
              <Text className="text-sm text-muted">{formatShortDate(event.eventAt)}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenShell>
  );
}
