import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const appRole = v.union(
  v.literal("student"),
  v.literal("lecturer"),
  v.literal("classRep"),
  v.literal("departmentAdmin"),
  v.literal("researcher"),
);

const consentStatus = v.union(v.literal("pending"), v.literal("granted"), v.literal("declined"));

const assignmentStatus = v.union(
  v.literal("upcoming"),
  v.literal("dueSoon"),
  v.literal("overdue"),
  v.literal("submitted"),
);

const submissionStatus = v.union(
  v.literal("submitted"),
  v.literal("missed"),
  v.literal("resubmitted"),
);

const nudgeType = v.union(
  v.literal("deadline-reminder"),
  v.literal("escalating-urgency"),
  v.literal("personalized-timing"),
  v.literal("progress-status"),
  v.literal("motivational"),
  v.literal("commitment-style"),
  v.literal("social-norm"),
);

const nudgeChannel = v.union(v.literal("in-app"), v.literal("push"));

const nudgeTone = v.union(
  v.literal("neutral"),
  v.literal("urgent"),
  v.literal("motivational"),
  v.literal("commitment"),
);

const nudgeUrgency = v.union(v.literal("low"), v.literal("medium"), v.literal("high"));

const nudgeDeliveryStatus = v.union(
  v.literal("scheduled"),
  v.literal("sent"),
  v.literal("failed"),
  v.literal("opened"),
);

const experimentStatus = v.union(
  v.literal("draft"),
  v.literal("running"),
  v.literal("paused"),
  v.literal("completed"),
);

const experimentAssignmentMethod = v.union(v.literal("random"), v.literal("manual"));

const activityEventType = v.union(
  v.literal("assignment_viewed"),
  v.literal("assignment_status_changed"),
  v.literal("nudge_opened"),
  v.literal("nudge_sent"),
  v.literal("submission_recorded"),
  v.literal("consent_updated"),
  v.literal("onboarding_completed"),
  v.literal("content_created"),
  v.literal("settings_updated"),
  v.literal("attendance_recorded"),
  v.literal("survey_submitted"),
  v.literal("data_ingested"),
);

const ingestionStatus = v.union(v.literal("running"), v.literal("succeeded"), v.literal("failed"));

const sourceType = v.union(
  v.literal("assignment"),
  v.literal("submission"),
  v.literal("timetable"),
);

const accessMethod = v.union(v.literal("api"), v.literal("database"), v.literal("import"));

const sourceConfigStatus = v.union(v.literal("pending"), v.literal("confirmed"));

const timetableKind = v.union(
  v.literal("lecture"),
  v.literal("tutorial"),
  v.literal("lab"),
  v.literal("exam"),
  v.literal("office-hours"),
  v.literal("reschedule"),
  v.literal("event"),
  v.literal("deadline"),
);

const resourceKind = v.union(
  v.literal("lecture-note"),
  v.literal("slides"),
  v.literal("recording"),
  v.literal("reading"),
  v.literal("link"),
  v.literal("template"),
  v.literal("form"),
);

const announcementCategory = v.union(
  v.literal("general"),
  v.literal("reschedule"),
  v.literal("assessment"),
  v.literal("event"),
  v.literal("wellness"),
  v.literal("system"),
);

const attendanceStatus = v.union(
  v.literal("present"),
  v.literal("late"),
  v.literal("absent"),
  v.literal("excused"),
);

const surveyStatus = v.union(v.literal("draft"), v.literal("live"), v.literal("closed"));

export default defineSchema({
  profiles: defineTable({
    authSubject: v.optional(v.string()),
    email: v.string(),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    roles: v.array(appRole),
    primaryRole: appRole,
    studentId: v.optional(v.string()),
    programme: v.optional(v.string()),
    level: v.optional(v.string()),
    consentStatus,
    consentedAt: v.optional(v.number()),
    onboardingCompletedAt: v.optional(v.number()),
    preferredReminderHour: v.optional(v.number()),
    timezone: v.optional(v.string()),
    lastActiveAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_authSubject", ["authSubject"])
    .index("by_email", ["email"])
    .index("by_role", ["primaryRole"])
    .index("by_studentId", ["studentId"]),

  notificationSettings: defineTable({
    profileId: v.id("profiles"),
    digestEnabled: v.boolean(),
    pushEnabled: v.boolean(),
    inAppEnabled: v.boolean(),
    motivationEnabled: v.boolean(),
    socialNormsEnabled: v.boolean(),
    commitmentEnabled: v.boolean(),
    timetableRemindersEnabled: v.boolean(),
    assignmentRemindersEnabled: v.boolean(),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_profile", ["profileId"]),

  courses: defineTable({
    code: v.string(),
    name: v.string(),
    school: v.optional(v.string()),
    semester: v.optional(v.string()),
    creditHours: v.optional(v.number()),
    description: v.optional(v.string()),
    lecturerProfileId: v.optional(v.id("profiles")),
    classRepProfileId: v.optional(v.id("profiles")),
    lmsUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

  courseEnrollments: defineTable({
    courseId: v.id("courses"),
    profileId: v.id("profiles"),
    roleInCourse: v.union(v.literal("student"), v.literal("lecturer"), v.literal("classRep")),
    enrolledAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_profile", ["profileId"])
    .index("by_course_profile", ["courseId", "profileId"]),

  timetableEvents: defineTable({
    courseId: v.optional(v.id("courses")),
    title: v.string(),
    description: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.number(),
    venue: v.optional(v.string()),
    kind: timetableKind,
    isRescheduled: v.boolean(),
    originalStartsAt: v.optional(v.number()),
    audienceRoles: v.array(appRole),
    cohortLabel: v.optional(v.string()),
    createdByProfileId: v.optional(v.id("profiles")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_start", ["startsAt"])
    .index("by_course", ["courseId"]),

  resources: defineTable({
    courseId: v.optional(v.id("courses")),
    title: v.string(),
    description: v.optional(v.string()),
    kind: resourceKind,
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    isPinned: v.boolean(),
    audienceRoles: v.array(appRole),
    uploadedByProfileId: v.optional(v.id("profiles")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_createdAt", ["createdAt"]),

  announcements: defineTable({
    courseId: v.optional(v.id("courses")),
    title: v.string(),
    body: v.string(),
    category: announcementCategory,
    publishedAt: v.number(),
    pinUntil: v.optional(v.number()),
    audienceRoles: v.array(appRole),
    postedByProfileId: v.optional(v.id("profiles")),
    linkUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_publishedAt", ["publishedAt"])
    .index("by_course", ["courseId"]),

  assignments: defineTable({
    sourceSystem: v.string(),
    sourceId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    courseCode: v.string(),
    dueAt: v.number(),
    publishedAt: v.optional(v.number()),
    weight: v.optional(v.number()),
    linkUrl: v.optional(v.string()),
    submissionMode: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_source", ["sourceSystem", "sourceId"])
    .index("by_dueAt", ["dueAt"]),

  assignmentRecipients: defineTable({
    assignmentId: v.id("assignments"),
    studentProfileId: v.id("profiles"),
    sourceStudentRef: v.optional(v.string()),
    assignmentDueAt: v.number(),
    assignedAt: v.number(),
    status: assignmentStatus,
    lastViewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student_due", ["studentProfileId", "assignmentDueAt"])
    .index("by_assignment", ["assignmentId"])
    .index("by_student_assignment", ["studentProfileId", "assignmentId"]),

  submissions: defineTable({
    assignmentId: v.id("assignments"),
    studentProfileId: v.id("profiles"),
    status: submissionStatus,
    submittedAt: v.optional(v.number()),
    isOnTime: v.boolean(),
    leadTimeHours: v.optional(v.number()),
    sourceSystem: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentProfileId"])
    .index("by_assignment_student", ["assignmentId", "studentProfileId"])
    .index("by_assignment", ["assignmentId"]),

  attendanceSessions: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
    location: v.optional(v.string()),
    createdByProfileId: v.optional(v.id("profiles")),
    createdAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_start", ["startsAt"]),

  attendanceRecords: defineTable({
    attendanceSessionId: v.id("attendanceSessions"),
    studentProfileId: v.id("profiles"),
    status: attendanceStatus,
    recordedAt: v.number(),
    note: v.optional(v.string()),
  })
    .index("by_session", ["attendanceSessionId"])
    .index("by_student", ["studentProfileId"])
    .index("by_session_student", ["attendanceSessionId", "studentProfileId"]),

  cohorts: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    year: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  cohortMembers: defineTable({
    cohortId: v.id("cohorts"),
    studentProfileId: v.id("profiles"),
    joinedAt: v.number(),
  })
    .index("by_cohort", ["cohortId"])
    .index("by_student", ["studentProfileId"])
    .index("by_cohort_student", ["cohortId", "studentProfileId"]),

  nudgeStrategies: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: nudgeType,
    config: v.optional(v.any()),
    isActive: v.boolean(),
    createdByProfileId: v.optional(v.id("profiles")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  nudgeTemplates: defineTable({
    strategyId: v.id("nudgeStrategies"),
    title: v.string(),
    body: v.string(),
    channel: nudgeChannel,
    tone: nudgeTone,
    minHoursBeforeDue: v.number(),
    maxHoursBeforeDue: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_strategy", ["strategyId"])
    .index("by_strategy_active", ["strategyId", "isActive"]),

  experiments: defineTable({
    name: v.string(),
    hypothesis: v.optional(v.string()),
    status: experimentStatus,
    cohortId: v.optional(v.id("cohorts")),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    createdByProfileId: v.optional(v.id("profiles")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_cohort", ["cohortId"]),

  experimentGroups: defineTable({
    experimentId: v.id("experiments"),
    name: v.string(),
    strategyId: v.id("nudgeStrategies"),
    allocationPercentage: v.number(),
    createdAt: v.number(),
  })
    .index("by_experiment", ["experimentId"])
    .index("by_strategy", ["strategyId"]),

  experimentAssignments: defineTable({
    experimentId: v.id("experiments"),
    groupId: v.id("experimentGroups"),
    studentProfileId: v.id("profiles"),
    assignedAt: v.number(),
    assignmentMethod: experimentAssignmentMethod,
  })
    .index("by_student", ["studentProfileId"])
    .index("by_experiment_student", ["experimentId", "studentProfileId"])
    .index("by_group", ["groupId"]),

  nudgeEvents: defineTable({
    studentProfileId: v.id("profiles"),
    assignmentId: v.optional(v.id("assignments")),
    strategyId: v.optional(v.id("nudgeStrategies")),
    templateId: v.optional(v.id("nudgeTemplates")),
    experimentId: v.optional(v.id("experiments")),
    groupId: v.optional(v.id("experimentGroups")),
    type: nudgeType,
    channel: nudgeChannel,
    title: v.string(),
    message: v.string(),
    urgency: nudgeUrgency,
    scheduledFor: v.number(),
    sentAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    deliveryStatus: nudgeDeliveryStatus,
    adaptationReason: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student_scheduled", ["studentProfileId", "scheduledFor"])
    .index("by_student_assignment", ["studentProfileId", "assignmentId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_experiment", ["experimentId"])
    .index("by_delivery", ["deliveryStatus"]),

  activityEvents: defineTable({
    studentProfileId: v.id("profiles"),
    assignmentId: v.optional(v.id("assignments")),
    eventType: activityEventType,
    eventAt: v.number(),
    payload: v.optional(v.any()),
    experimentId: v.optional(v.id("experiments")),
    groupId: v.optional(v.id("experimentGroups")),
  })
    .index("by_student_event", ["studentProfileId", "eventAt"])
    .index("by_student_type", ["studentProfileId", "eventType"])
    .index("by_eventType", ["eventType"])
    .index("by_assignment", ["assignmentId"]),

  ingestionRuns: defineTable({
    sourceSystem: v.string(),
    status: ingestionStatus,
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    recordsIngested: v.number(),
    errorMessage: v.optional(v.string()),
  })
    .index("by_startedAt", ["startedAt"])
    .index("by_sourceSystem", ["sourceSystem"]),

  sourceConfigs: defineTable({
    sourceType,
    systemName: v.string(),
    accessMethod,
    minReliableFields: v.array(v.string()),
    status: sourceConfigStatus,
    notes: v.optional(v.string()),
    updatedByProfileId: v.optional(v.id("profiles")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sourceType", ["sourceType"])
    .index("by_status", ["status"]),

  surveyTemplates: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    audienceRoles: v.array(appRole),
    status: surveyStatus,
    questions: v.array(
      v.object({
        id: v.string(),
        prompt: v.string(),
        scaleMin: v.optional(v.number()),
        scaleMax: v.optional(v.number()),
      }),
    ),
    createdByProfileId: v.optional(v.id("profiles")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  surveyResponses: defineTable({
    surveyTemplateId: v.id("surveyTemplates"),
    respondentProfileId: v.id("profiles"),
    submittedAt: v.number(),
    answers: v.array(
      v.object({
        questionId: v.string(),
        value: v.string(),
      }),
    ),
  })
    .index("by_survey", ["surveyTemplateId"])
    .index("by_respondent", ["respondentProfileId"])
    .index("by_survey_respondent", ["surveyTemplateId", "respondentProfileId"]),
});
