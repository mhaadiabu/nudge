import { api } from "@nudge/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button, Input, Label, TextField, useToast } from "heroui-native";
import {
  Activity01Icon,
  BookOpen01Icon,
  Calendar01Icon,
  Database01Icon,
  FlaskConicalIcon,
  Megaphone01Icon,
  PencilEdit01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Text, View } from "react-native";

import { DateTimeField } from "@/components/datetime-field";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { MetricGrid } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { formatPercent, formatRole, formatShortDate } from "@/lib/format";

const sharedAudience = [
  "student",
  "lecturer",
  "classRep",
  "departmentAdmin",
  "researcher",
] as const;

type FormState = {
  announcementTitle: string;
  announcementCourseCode: string;
  announcementBody: string;
  resourceTitle: string;
  resourceCourseCode: string;
  resourceUrl: string;
  eventTitle: string;
  eventCourseCode: string;
  eventVenue: string;
  eventStartsAt: number;
  assignmentTitle: string;
  assignmentCourseCode: string;
  assignmentDueAt: number;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function nextRoundHour(): number {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date.getTime();
}

function defaultDueAt(): number {
  return Date.now() + 2 * DAY_MS;
}

const emptyForm: FormState = {
  announcementTitle: "",
  announcementCourseCode: "",
  announcementBody: "",
  resourceTitle: "",
  resourceCourseCode: "",
  resourceUrl: "",
  eventTitle: "",
  eventCourseCode: "",
  eventVenue: "",
  eventStartsAt: nextRoundHour(),
  assignmentTitle: "",
  assignmentCourseCode: "",
  assignmentDueAt: defaultDueAt(),
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <TextField>
      <Label>{label}</Label>
      {children}
    </TextField>
  );
}

export default function ManagementScreen() {
  const { toast } = useToast();
  const viewer = useQuery(api.profiles.getViewer);
  const overview = useQuery(
    api.portal.getManagerOverview,
    viewer?.primaryRole !== "student" ? {} : "skip",
  );
  const readiness = useQuery(
    api.sources.getPhaseZeroReadiness,
    viewer?.primaryRole !== "student" ? {} : "skip",
  );
  const summary = useQuery(
    api.analytics.getDashboardSummary,
    viewer?.primaryRole !== "student" ? {} : "skip",
  );
  const activityLog = useQuery(
    api.analytics.listActivityLog,
    viewer?.primaryRole !== "student" ? { limit: 10 } : "skip",
  );
  const people = useQuery(api.profiles.listPeople, viewer?.primaryRole !== "student" ? {} : "skip");
  const experiments = useQuery(
    api.experiments.listExperiments,
    viewer?.primaryRole !== "student" ? {} : "skip",
  );
  const strategies = useQuery(
    api.experiments.listStrategies,
    viewer?.primaryRole !== "student" ? {} : "skip",
  );

  const seedDemoData = useMutation(api.seed.seedDemoData);
  const createAnnouncement = useMutation(api.portal.createAnnouncement);
  const createResource = useMutation(api.portal.createResource);
  const createTimetableEvent = useMutation(api.portal.createTimetableEvent);
  const createAssignment = useMutation(api.assignments.createForCourse);

  const [form, setForm] = useState<FormState>(emptyForm);

  const updateField =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
    };

  if (!viewer) {
    return <LoadingScreen />;
  }

  if (viewer.primaryRole === "student") {
    return (
      <ScreenShell>
        <SectionCard title="Access required" flat>
          <Text className="text-sm leading-5 text-muted">
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

  function rateTone(value: number): "success" | "warning" | "default" {
    if (value >= 0.8) return "success";
    if (value >= 0.5) return "warning";
    return "default";
  }

  return (
    <ScreenShell>
      <MetricGrid
        metrics={[
          { label: "Students", value: String(overview.counts.students), icon: UserMultipleIcon },
          { label: "Managers", value: String(overview.counts.managers) },
          {
            label: "On-time",
            value: formatPercent(summary.submissionMetrics.onTimeRate),
            detail: "Submissions",
            emphasis: rateTone(summary.submissionMetrics.onTimeRate),
          },
          {
            label: "Nudge open",
            value: formatPercent(summary.nudgeMetrics.openRate),
            emphasis: rateTone(summary.nudgeMetrics.openRate),
          },
        ]}
      />

      <SectionCard
        title="Data sources"
        description={
          readiness.isReady
            ? "All data sources are connected."
            : "Some data sources still need to be connected."
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
              label: result.seeded ? "Demo data seeded" : result.message,
            });
          }}
        >
          <Button.Label>Seed demo data</Button.Label>
        </Button>
      </SectionCard>

      <SectionCard title="Publish announcement" icon={Megaphone01Icon} flat>
        <View className="gap-3">
          <FormField label="Title">
            <Input
              value={form.announcementTitle}
              onChangeText={updateField("announcementTitle")}
              placeholder="Announcement title"
            />
          </FormField>
          <FormField label="Course code">
            <Input
              value={form.announcementCourseCode}
              onChangeText={updateField("announcementCourseCode")}
              placeholder="Optional"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </FormField>
          <FormField label="Body">
            <Input
              value={form.announcementBody}
              onChangeText={updateField("announcementBody")}
              placeholder="What do you want to share?"
              multiline
              numberOfLines={4}
              className="min-h-24"
            />
          </FormField>
          <Button
            className="self-start"
            onPress={async () => {
              await createAnnouncement({
                courseCode: form.announcementCourseCode || undefined,
                title: form.announcementTitle,
                body: form.announcementBody,
                category: "general",
                audienceRoles: [...sharedAudience],
                linkUrl: undefined,
              });
              setForm((current) => ({
                ...current,
                announcementTitle: "",
                announcementCourseCode: "",
                announcementBody: "",
              }));
              toast.show({ variant: "success", label: "Announcement published" });
            }}
          >
            <Button.Label>Publish</Button.Label>
          </Button>
        </View>
      </SectionCard>

      <SectionCard title="Publish resource" icon={BookOpen01Icon} flat>
        <View className="gap-3">
          <FormField label="Title">
            <Input
              value={form.resourceTitle}
              onChangeText={updateField("resourceTitle")}
              placeholder="Resource title"
            />
          </FormField>
          <FormField label="Course code">
            <Input
              value={form.resourceCourseCode}
              onChangeText={updateField("resourceCourseCode")}
              placeholder="Optional"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </FormField>
          <FormField label="URL">
            <Input
              value={form.resourceUrl}
              onChangeText={updateField("resourceUrl")}
              placeholder="https://..."
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </FormField>
          <Button
            className="self-start"
            onPress={async () => {
              await createResource({
                courseCode: form.resourceCourseCode || undefined,
                title: form.resourceTitle,
                description: "Shared from the management console.",
                kind: "link",
                url: form.resourceUrl,
                audienceRoles: [...sharedAudience],
                isPinned: true,
              });
              setForm((current) => ({
                ...current,
                resourceTitle: "",
                resourceCourseCode: "",
                resourceUrl: "",
              }));
              toast.show({ variant: "success", label: "Resource published" });
            }}
          >
            <Button.Label>Add resource</Button.Label>
          </Button>
        </View>
      </SectionCard>

      <SectionCard title="Schedule event" icon={Calendar01Icon} flat>
        <View className="gap-3">
          <FormField label="Title">
            <Input
              value={form.eventTitle}
              onChangeText={updateField("eventTitle")}
              placeholder="Event title"
            />
          </FormField>
          <FormField label="Course code">
            <Input
              value={form.eventCourseCode}
              onChangeText={updateField("eventCourseCode")}
              placeholder="Optional"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </FormField>
          <FormField label="Venue">
            <Input
              value={form.eventVenue}
              onChangeText={updateField("eventVenue")}
              placeholder="e.g. Lecture Hall 2"
            />
          </FormField>
          <DateTimeField
            label="Starts"
            value={form.eventStartsAt}
            onChange={updateField("eventStartsAt")}
            minValue={Date.now()}
          />
          <Button
            className="self-start"
            onPress={async () => {
              const startsAt = form.eventStartsAt;
              await createTimetableEvent({
                courseCode: form.eventCourseCode || undefined,
                title: form.eventTitle,
                description: "Added from the management console.",
                startsAt,
                endsAt: startsAt + 2 * HOUR_MS,
                venue: form.eventVenue,
                kind: "event",
                audienceRoles: [...sharedAudience],
                isRescheduled: false,
                originalStartsAt: undefined,
              });
              setForm((current) => ({
                ...current,
                eventTitle: "",
                eventCourseCode: "",
                eventVenue: "",
                eventStartsAt: nextRoundHour(),
              }));
              toast.show({ variant: "success", label: "Event scheduled" });
            }}
          >
            <Button.Label>Create event</Button.Label>
          </Button>
        </View>
      </SectionCard>

      <SectionCard title="Create assignment" icon={PencilEdit01Icon} flat>
        <View className="gap-3">
          <FormField label="Title">
            <Input
              value={form.assignmentTitle}
              onChangeText={updateField("assignmentTitle")}
              placeholder="Assignment title"
            />
          </FormField>
          <FormField label="Course code">
            <Input
              value={form.assignmentCourseCode}
              onChangeText={updateField("assignmentCourseCode")}
              placeholder="e.g. CS201"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </FormField>
          <DateTimeField
            label="Due"
            value={form.assignmentDueAt}
            onChange={updateField("assignmentDueAt")}
            minValue={Date.now()}
          />
          <Button
            className="self-start"
            onPress={async () => {
              await createAssignment({
                courseCode: form.assignmentCourseCode,
                title: form.assignmentTitle,
                description: "Created from the management console.",
                dueAt: form.assignmentDueAt,
                weight: 10,
                linkUrl: undefined,
              });
              setForm((current) => ({
                ...current,
                assignmentTitle: "",
                assignmentCourseCode: "",
                assignmentDueAt: defaultDueAt(),
              }));
              toast.show({ variant: "success", label: "Assignment created" });
            }}
          >
            <Button.Label>Create assignment</Button.Label>
          </Button>
        </View>
      </SectionCard>

      <SectionCard
        title="People"
        description={`${people.length} in this workspace`}
        icon={UserMultipleIcon}
        flat
      >
        <View className="gap-3.5">
          {people.slice(0, 8).map((person, index) => (
            <View
              key={person._id}
              className={`flex-row items-center gap-3 ${
                index > 0 ? "pt-3.5 border-t border-separator" : ""
              }`}
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-xl bg-accent-soft"
                style={{ borderCurve: "continuous" }}
              >
                <Icon
                  icon={UserMultipleIcon}
                  size={16}
                  strokeWidth={2}
                  className="text-accent-soft-foreground"
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-medium text-foreground">
                  {person.fullName ?? person.email}
                </Text>
                <Text className="text-xs text-muted">
                  {formatRole(person.roles ?? person.primaryRole)} ·{" "}
                  {person.studentId ?? person.email}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Experiments and strategies"
        description={`${experiments.length} experiments · ${strategies.length} strategies`}
        icon={FlaskConicalIcon}
        flat
      >
        <View className="gap-3.5">
          {experiments.slice(0, 4).map((experiment, index) => (
            <View
              key={experiment._id}
              className={`flex-row items-start gap-3 ${
                index > 0 ? "pt-3.5 border-t border-separator" : ""
              }`}
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-xl bg-info-soft"
                style={{ borderCurve: "continuous" }}
              >
                <Icon
                  icon={FlaskConicalIcon}
                  size={16}
                  strokeWidth={2}
                  className="text-info-soft-foreground"
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

      <SectionCard title="Recent activity" icon={Activity01Icon} flat>
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
                <Text className="text-sm font-medium text-foreground">{event.eventType}</Text>
                <Text className="text-xs text-muted">{formatShortDate(event.eventAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenShell>
  );
}
