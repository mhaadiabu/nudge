import { api } from "@nudge/backend/convex/_generated/api";
import type { Id } from "@nudge/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Button, Input, Label, TextField, useToast } from "heroui-native";
import {
  Activity01Icon,
  BookOpen01Icon,
  Calendar01Icon,
  Database01Icon,
  DocumentAttachmentIcon,
  FlaskConicalIcon,
  LinkSquare02Icon,
  Megaphone01Icon,
  PencilEdit01Icon,
  SearchRemoveIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { DateTimeField } from "@/components/datetime-field";
import { FilterChip } from "@/components/filter-chip";
import { Icon } from "@/components/icon";
import { LoadingScreen } from "@/components/loading-screen";
import { MetricGrid } from "@/components/metric-card";
import { ScreenShell } from "@/components/screen-shell";
import { SectionCard } from "@/components/section-card";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { formatFileSize, formatPercent, formatRole, formatShortDate } from "@/lib/format";
import { pickResourceFile, uploadFile, type PickedFile } from "@/lib/uploads";

const sharedAudience = [
  "student",
  "lecturer",
  "classRep",
  "departmentAdmin",
  "researcher",
] as const;

const resourceKindOptions = [
  { value: "lecture-note", label: "Note" },
  { value: "slides", label: "Slides" },
  { value: "recording", label: "Recording" },
  { value: "reading", label: "Reading" },
  { value: "template", label: "Template" },
  { value: "form", label: "Form" },
] as const;

type ResourceKind = (typeof resourceKindOptions)[number]["value"];

const announcementCategoryOptions = [
  { value: "general", label: "General" },
  { value: "reschedule", label: "Reschedule" },
  { value: "assessment", label: "Assessment" },
  { value: "event", label: "Event" },
  { value: "wellness", label: "Wellness" },
  { value: "system", label: "System" },
] as const;

type AnnouncementCategory = (typeof announcementCategoryOptions)[number]["value"];

const eventKindOptions = [
  { value: "lecture", label: "Lecture" },
  { value: "tutorial", label: "Tutorial" },
  { value: "lab", label: "Lab" },
  { value: "exam", label: "Exam" },
  { value: "office-hours", label: "Office" },
  { value: "reschedule", label: "Reschedule" },
  { value: "event", label: "Event" },
  { value: "deadline", label: "Deadline" },
] as const;

type EventKind = (typeof eventKindOptions)[number]["value"];

type FormState = {
  announcementTitle: string;
  announcementCourseCode: string;
  announcementBody: string;
  announcementCategory: AnnouncementCategory;
  resourceTitle: string;
  resourceCourseCode: string;
  resourceKind: ResourceKind;
  resourceMode: "file" | "url";
  resourceUrl: string;
  resourceFile: PickedFile | null;
  eventTitle: string;
  eventCourseCode: string;
  eventVenue: string;
  eventKind: EventKind;
  eventStartsAt: number;
  eventEndsAt: number;
  assignmentTitle: string;
  assignmentCourseCode: string;
  assignmentDescription: string;
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
  announcementCategory: "general",
  resourceTitle: "",
  resourceCourseCode: "",
  resourceKind: "lecture-note",
  resourceMode: "file",
  resourceUrl: "",
  resourceFile: null,
  eventTitle: "",
  eventCourseCode: "",
  eventVenue: "",
  eventKind: "event",
  eventStartsAt: nextRoundHour(),
  eventEndsAt: nextRoundHour() + HOUR_MS,
  assignmentTitle: "",
  assignmentCourseCode: "",
  assignmentDescription: "",
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

type PickerProps<T extends string> = {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

function InlinePicker<T extends string>({ label, value, options, onChange }: PickerProps<T>) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-muted">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

type DeleteButtonProps = {
  onPress: () => void;
  label?: string;
};

function DeleteButton({ onPress, label = "Delete" }: DeleteButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="rounded-md px-2 py-1 active:opacity-60"
    >
      <View className="flex-row items-center gap-1">
        <Icon icon={SearchRemoveIcon} size={14} strokeWidth={2} className="text-danger" />
        <Text className="text-xs font-semibold text-danger">{label}</Text>
      </View>
    </Pressable>
  );
}

function confirmDelete(title: string, message: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
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
  const announcements = useQuery(
    api.portal.listAnnouncements,
    viewer?.primaryRole !== "student" ? {} : "skip",
  );
  const resources = useQuery(
    api.portal.listResources,
    viewer?.primaryRole !== "student" ? {} : "skip",
  );

  const seedDemoData = useMutation(api.seed.seedDemoData);
  const createAnnouncement = useMutation(api.portal.createAnnouncement);
  const deleteAnnouncement = useMutation(api.portal.deleteAnnouncement);
  const createResource = useMutation(api.portal.createResource);
  const deleteResource = useMutation(api.portal.deleteResource);
  const generateResourceUploadUrl = useMutation(api.portal.generateResourceUploadUrl);
  const createTimetableEvent = useMutation(api.portal.createTimetableEvent);
  const createAssignment = useMutation(api.assignments.createForCourse);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [busyAction, setBusyAction] = useState<string | null>(null);

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
    !strategies ||
    !announcements ||
    !resources
  ) {
    return <LoadingScreen message="Loading management tools..." />;
  }

  function rateTone(value: number): "success" | "warning" | "default" {
    if (value >= 0.8) return "success";
    if (value >= 0.5) return "warning";
    return "default";
  }

  async function runAction(name: string, fn: () => Promise<void>) {
    if (busyAction) {
      return;
    }
    setBusyAction(name);
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      toast.show({ variant: "danger", label: message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSeed() {
    await runAction("seed", async () => {
      const result = await seedDemoData({});
      toast.show({
        variant: result.seeded ? "success" : "danger",
        label: result.seeded ? "Demo data seeded" : result.message,
      });
    });
  }

  async function handlePublishAnnouncement() {
    if (!form.announcementTitle.trim() || !form.announcementBody.trim()) {
      toast.show({ variant: "danger", label: "Title and body are required." });
      return;
    }
    await runAction("announcement", async () => {
      await createAnnouncement({
        courseCode: form.announcementCourseCode || undefined,
        title: form.announcementTitle,
        body: form.announcementBody,
        category: form.announcementCategory,
        audienceRoles: [...sharedAudience],
        linkUrl: undefined,
      });
      setForm((current) => ({
        ...current,
        announcementTitle: "",
        announcementCourseCode: "",
        announcementBody: "",
        announcementCategory: "general",
      }));
      toast.show({ variant: "success", label: "Announcement published" });
    });
  }

  async function handlePickResource() {
    const file = await pickResourceFile();
    if (file) {
      setForm((current) => ({
        ...current,
        resourceFile: file,
        resourceTitle: current.resourceTitle || file.name,
      }));
    }
  }

  async function handlePublishResource() {
    if (!form.resourceTitle.trim()) {
      toast.show({ variant: "danger", label: "Title is required." });
      return;
    }
    if (form.resourceMode === "url" && !form.resourceUrl.trim()) {
      toast.show({ variant: "danger", label: "Enter a URL or attach a file." });
      return;
    }
    if (form.resourceMode === "file" && !form.resourceFile) {
      toast.show({ variant: "danger", label: "Attach a file before publishing." });
      return;
    }

    await runAction("resource", async () => {
      let storageId: Id<"_storage"> | undefined;
      if (form.resourceMode === "file" && form.resourceFile) {
        storageId = (await uploadFile(form.resourceFile, () =>
          generateResourceUploadUrl({}),
        )) as Id<"_storage">;
      }
      await createResource({
        courseCode: form.resourceCourseCode || undefined,
        title: form.resourceTitle,
        description: form.resourceFile
          ? `${form.resourceFile.name} (${formatFileSize(form.resourceFile.size)})`
          : "Shared from the management console.",
        kind: form.resourceMode === "url" ? "link" : form.resourceKind,
        url: form.resourceMode === "url" ? form.resourceUrl : undefined,
        storageId,
        fileName: form.resourceFile?.name,
        fileSize: form.resourceFile?.size,
        mimeType: form.resourceFile?.mimeType,
        audienceRoles: [...sharedAudience],
        isPinned: true,
      });
      setForm((current) => ({
        ...current,
        resourceTitle: "",
        resourceCourseCode: "",
        resourceUrl: "",
        resourceFile: null,
      }));
      toast.show({ variant: "success", label: "Resource published" });
    });
  }

  async function handleScheduleEvent() {
    if (!form.eventTitle.trim()) {
      toast.show({ variant: "danger", label: "Title is required." });
      return;
    }
    if (form.eventEndsAt <= form.eventStartsAt) {
      toast.show({ variant: "danger", label: "End time must be after start time." });
      return;
    }
    await runAction("event", async () => {
      await createTimetableEvent({
        courseCode: form.eventCourseCode || undefined,
        title: form.eventTitle,
        description: "Added from the management console.",
        startsAt: form.eventStartsAt,
        endsAt: form.eventEndsAt,
        venue: form.eventVenue,
        kind: form.eventKind,
        audienceRoles: [...sharedAudience],
        isRescheduled: form.eventKind === "reschedule",
        originalStartsAt:
          form.eventKind === "reschedule" ? form.eventStartsAt - HOUR_MS : undefined,
      });
      setForm((current) => ({
        ...current,
        eventTitle: "",
        eventCourseCode: "",
        eventVenue: "",
        eventKind: "event",
        eventStartsAt: nextRoundHour(),
        eventEndsAt: nextRoundHour() + HOUR_MS,
      }));
      toast.show({ variant: "success", label: "Event scheduled" });
    });
  }

  async function handleCreateAssignment() {
    if (!form.assignmentTitle.trim() || !form.assignmentCourseCode.trim()) {
      toast.show({ variant: "danger", label: "Title and course code are required." });
      return;
    }
    await runAction("assignment", async () => {
      await createAssignment({
        courseCode: form.assignmentCourseCode,
        title: form.assignmentTitle,
        description: form.assignmentDescription.trim() || undefined,
        dueAt: form.assignmentDueAt,
        weight: 10,
        linkUrl: undefined,
      });
      setForm((current) => ({
        ...current,
        assignmentTitle: "",
        assignmentCourseCode: "",
        assignmentDescription: "",
        assignmentDueAt: defaultDueAt(),
      }));
      toast.show({ variant: "success", label: "Assignment created" });
    });
  }

  function handleDeleteAnnouncement(id: string, title: string) {
    confirmDelete("Delete announcement", `Permanently remove "${title}"?`, () => {
      void runAction(`announcement-${id}`, async () => {
        await deleteAnnouncement({ announcementId: id as never });
        toast.show({ variant: "success", label: "Announcement deleted" });
      });
    });
  }

  function handleDeleteResource(id: string, title: string) {
    confirmDelete("Delete resource", `Permanently remove "${title}"?`, () => {
      void runAction(`resource-${id}`, async () => {
        await deleteResource({ resourceId: id as never });
        toast.show({ variant: "success", label: "Resource deleted" });
      });
    });
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
        <Button className="self-start" isDisabled={busyAction !== null} onPress={handleSeed}>
          <Button.Label>{busyAction === "seed" ? "Seeding..." : "Seed demo data"}</Button.Label>
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
          <InlinePicker
            label="Category"
            value={form.announcementCategory}
            options={announcementCategoryOptions}
            onChange={updateField("announcementCategory")}
          />
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
            isDisabled={busyAction !== null}
            onPress={handlePublishAnnouncement}
          >
            <Button.Label>
              {busyAction === "announcement" ? "Publishing..." : "Publish"}
            </Button.Label>
          </Button>
        </View>
      </SectionCard>

      {announcements.length > 0 ? (
        <SectionCard
          title="Recent announcements"
          description={`${announcements.length} published`}
          icon={Megaphone01Icon}
          flat
        >
          <View className="gap-3 divide-y divide-separator">
            {announcements.slice(0, 5).map((announcement) => (
              <View
                key={announcement._id}
                className="flex-row items-start justify-between gap-3 pt-3 first:pt-0"
              >
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {announcement.title}
                  </Text>
                  <Text className="text-xs text-muted" numberOfLines={2}>
                    {announcement.body}
                  </Text>
                  <Text className="text-[11px] text-muted">
                    {announcement.course?.code ?? "Faculty"} ·{" "}
                    {formatShortDate(announcement.publishedAt)}
                  </Text>
                </View>
                <DeleteButton
                  label="Delete"
                  onPress={() => handleDeleteAnnouncement(announcement._id, announcement.title)}
                />
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      <SectionCard title="Publish resource" icon={BookOpen01Icon} flat>
        <View className="flex-row gap-2">
          {(
            [
              { value: "file", label: "Upload file", icon: DocumentAttachmentIcon },
              { value: "url", label: "External link", icon: LinkSquare02Icon },
            ] as const
          ).map((option) => {
            const active = form.resourceMode === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
                onPress={() => updateField("resourceMode")(option.value)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 ${
                  active ? "bg-accent" : "bg-surface-tertiary"
                }`}
                style={{ borderCurve: "continuous" }}
              >
                <Icon
                  icon={option.icon}
                  size={14}
                  strokeWidth={2}
                  className={active ? "text-accent-foreground" : "text-foreground"}
                />
                <Text
                  className={`text-sm font-semibold ${
                    active ? "text-accent-foreground" : "text-foreground"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
          {form.resourceMode === "file" ? (
            <>
              <InlinePicker
                label="Type"
                value={form.resourceKind}
                options={resourceKindOptions}
                onChange={updateField("resourceKind")}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={form.resourceFile ? "Replace file" : "Choose file"}
                onPress={handlePickResource}
                className="flex-row items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-3 active:opacity-70"
                style={{ borderCurve: "continuous" }}
              >
                <View className="flex-1 gap-0.5">
                  <Text
                    className={`text-base ${form.resourceFile ? "text-foreground" : "text-muted"}`}
                    numberOfLines={1}
                  >
                    {form.resourceFile?.name ?? "Tap to choose a file"}
                  </Text>
                  {form.resourceFile ? (
                    <Text className="text-xs text-muted">
                      {formatFileSize(form.resourceFile.size)}
                      {form.resourceFile.mimeType ? ` · ${form.resourceFile.mimeType}` : ""}
                    </Text>
                  ) : null}
                </View>
                <Icon
                  icon={DocumentAttachmentIcon}
                  size={16}
                  strokeWidth={2}
                  className="text-muted"
                />
              </Pressable>
            </>
          ) : (
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
          )}
          <Button
            className="self-start"
            isDisabled={busyAction !== null}
            onPress={handlePublishResource}
          >
            <Button.Label>
              {busyAction === "resource" ? "Publishing..." : "Add resource"}
            </Button.Label>
          </Button>
        </View>
      </SectionCard>

      {resources.length > 0 ? (
        <SectionCard
          title="Recent resources"
          description={`${resources.length} shared`}
          icon={BookOpen01Icon}
          flat
        >
          {resources.length === 0 ? (
            <EmptyState
              icon={BookOpen01Icon}
              title="No resources yet"
              message="Use the form above to share a file or link with your team."
              tone="info"
            />
          ) : (
            <View className="gap-3 divide-y divide-separator">
              {resources.slice(0, 5).map((resource) => (
                <View
                  key={resource._id}
                  className="flex-row items-start justify-between gap-3 pt-3 first:pt-0"
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                      {resource.title}
                    </Text>
                    <Text className="text-xs text-muted" numberOfLines={2}>
                      {resource.course?.code ?? "Faculty"} · {resource.kind}
                      {resource.fileName ? ` · ${resource.fileName}` : ""}
                    </Text>
                    <Text className="text-[11px] text-muted">
                      Added {formatShortDate(resource.createdAt)}
                    </Text>
                  </View>
                  <DeleteButton
                    label="Delete"
                    onPress={() => handleDeleteResource(resource._id, resource.title)}
                  />
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      ) : null}

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
          <InlinePicker
            label="Type"
            value={form.eventKind}
            options={eventKindOptions}
            onChange={updateField("eventKind")}
          />
          <DateTimeField
            label="Starts"
            value={form.eventStartsAt}
            onChange={updateField("eventStartsAt")}
            minValue={Date.now()}
          />
          <DateTimeField
            label="Ends"
            value={form.eventEndsAt}
            onChange={updateField("eventEndsAt")}
            minValue={form.eventStartsAt}
          />
          <Button
            className="self-start"
            isDisabled={busyAction !== null}
            onPress={handleScheduleEvent}
          >
            <Button.Label>{busyAction === "event" ? "Scheduling..." : "Create event"}</Button.Label>
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
              placeholder="e.g. CS301"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={form.assignmentDescription}
              onChangeText={updateField("assignmentDescription")}
              placeholder="What should students do?"
              multiline
              numberOfLines={4}
              className="min-h-24"
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
            isDisabled={busyAction !== null}
            onPress={handleCreateAssignment}
          >
            <Button.Label>
              {busyAction === "assignment" ? "Creating..." : "Create assignment"}
            </Button.Label>
          </Button>
        </View>
      </SectionCard>

      <SectionCard
        title="People"
        description={`${people.length} in this workspace`}
        icon={UserMultipleIcon}
        flat
      >
        <View className="gap-3.5 divide-y divide-separator">
          {people.slice(0, 8).map((person) => (
            <View
              key={person._id}
              className="flex-row items-center gap-3 pt-3.5 first:pt-0"
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-2xl bg-accent-soft"
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
        <View className="gap-3.5 divide-y divide-separator">
          {experiments.slice(0, 4).map((experiment) => (
            <View
              key={experiment._id}
              className="flex-row items-start gap-3 pt-3.5 first:pt-0"
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-2xl bg-info-soft"
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
        <View className="gap-3 divide-y divide-separator">
          {activityLog.map((event) => (
            <View
              key={event._id}
              className="flex-row items-start gap-3 pt-3 first:pt-0"
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
