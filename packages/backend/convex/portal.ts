import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { ensureManagementAccess, getViewerProfileOrThrow, isPrivilegedRole } from "./lib/auth";

function sortByPublished<T extends { publishedAt: number }>(rows: T[]) {
  return [...rows].sort((a, b) => b.publishedAt - a.publishedAt);
}

function matchesAudience(audienceRoles: string[], viewerRoles: string[]) {
  return audienceRoles.some((role) => viewerRoles.includes(role));
}

async function getViewerCourseIds(ctx: QueryCtx, viewerId: Id<"profiles">) {
  const enrollments = await ctx.db
    .query("courseEnrollments")
    .withIndex("by_profile", (query) => query.eq("profileId", viewerId))
    .collect();
  return [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
}

export const getStudentDashboard = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const settings = await ctx.db
      .query("notificationSettings")
      .withIndex("by_profile", (query) => query.eq("profileId", viewer._id))
      .unique();
    const courseIds = await getViewerCourseIds(ctx, viewer._id);

    const courses = (await Promise.all(courseIds.map((courseId) => ctx.db.get(courseId)))).filter(
      (course) => course !== null,
    );

    const recipients = await ctx.db
      .query("assignmentRecipients")
      .withIndex("by_student_due", (query) => query.eq("studentProfileId", viewer._id))
      .collect();
    const upcomingAssignments = (
      await Promise.all(
        recipients.slice(0, 6).map(async (recipient) => {
          const assignment = await ctx.db.get(recipient.assignmentId);
          if (!assignment) {
            return null;
          }
          return {
            assignmentRecipientId: recipient._id,
            assignmentId: assignment._id,
            title: assignment.title,
            courseCode: assignment.courseCode,
            dueAt: assignment.dueAt,
            status: recipient.status,
            linkUrl: assignment.linkUrl,
          };
        }),
      )
    )
      .filter((assignment) => assignment !== null)
      .sort((a, b) => a.dueAt - b.dueAt);

    const timetable = (await ctx.db.query("timetableEvents").withIndex("by_start").collect())
      .filter(
        (event) => event.endsAt >= Date.now() && matchesAudience(event.audienceRoles, viewer.roles),
      )
      .filter((event) => (event.courseId ? courseIds.includes(event.courseId) : true))
      .slice(0, 8);

    const announcements = sortByPublished(await ctx.db.query("announcements").collect())
      .filter((announcement) => matchesAudience(announcement.audienceRoles, viewer.roles))
      .filter((announcement) =>
        announcement.courseId ? courseIds.includes(announcement.courseId) : true,
      )
      .slice(0, 5);

    const resources = (await ctx.db.query("resources").withIndex("by_createdAt").collect())
      .filter((resource) => matchesAudience(resource.audienceRoles, viewer.roles))
      .filter((resource) => (resource.courseId ? courseIds.includes(resource.courseId) : true))
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.createdAt - a.createdAt)
      .slice(0, 6);

    const attendanceRecords = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_student", (query) => query.eq("studentProfileId", viewer._id))
      .collect();
    const presentCount = attendanceRecords.filter((record) => record.status === "present").length;
    const lateCount = attendanceRecords.filter((record) => record.status === "late").length;
    const attendanceRate =
      attendanceRecords.length === 0
        ? 0
        : (presentCount + lateCount * 0.5) / attendanceRecords.length;

    const liveSurveys = await ctx.db
      .query("surveyTemplates")
      .withIndex("by_status", (query) => query.eq("status", "live"))
      .collect();
    const survey =
      liveSurveys.find((item) => matchesAudience(item.audienceRoles, viewer.roles)) ?? null;

    const experimentAssignments = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_student", (query) => query.eq("studentProfileId", viewer._id))
      .collect();
    const latestExperimentAssignment = [...experimentAssignments].sort(
      (a, b) => b.assignedAt - a.assignedAt,
    )[0];
    const latestGroup = latestExperimentAssignment
      ? await ctx.db.get(latestExperimentAssignment.groupId)
      : null;
    const latestExperiment = latestExperimentAssignment
      ? await ctx.db.get(latestExperimentAssignment.experimentId)
      : null;

    return {
      viewer,
      settings,
      courses,
      upcomingAssignments,
      timetable,
      announcements,
      resources,
      attendanceSummary: {
        totalSessions: attendanceRecords.length,
        presentCount,
        lateCount,
        attendanceRate,
      },
      experiment: latestExperiment
        ? {
            name: latestExperiment.name,
            status: latestExperiment.status,
            groupName: latestGroup?.name ?? null,
          }
        : null,
      survey,
    };
  },
});

export const listCalendarFeed = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const courseIds = await getViewerCourseIds(ctx, viewer._id);

    const timetable = await ctx.db.query("timetableEvents").withIndex("by_start").collect();
    const assignments = await ctx.db
      .query("assignmentRecipients")
      .withIndex("by_student_due", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const items = [
      ...timetable
        .filter((event) => matchesAudience(event.audienceRoles, viewer.roles))
        .filter((event) => (event.courseId ? courseIds.includes(event.courseId) : true))
        .map((event) => ({
          id: event._id,
          kind: "timetable" as const,
          title: event.title,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          detail: event.venue ?? event.description ?? "",
          status: event.kind,
        })),
      ...(
        await Promise.all(
          assignments.map(async (recipient) => {
            const assignment = await ctx.db.get(recipient.assignmentId);
            if (!assignment) {
              return null;
            }
            return {
              id: recipient._id,
              kind: "assignment" as const,
              title: assignment.title,
              startsAt: assignment.dueAt,
              endsAt: assignment.dueAt,
              detail: assignment.courseCode,
              status: recipient.status,
            };
          }),
        )
      ).filter((item) => item !== null),
    ];

    return items.sort((a, b) => a.startsAt - b.startsAt);
  },
});

export const listResources = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const courseIds = await getViewerCourseIds(ctx, viewer._id);
    const resources = await ctx.db.query("resources").withIndex("by_createdAt").collect();

    const rows = await Promise.all(
      resources
        .filter((resource) => matchesAudience(resource.audienceRoles, viewer.roles))
        .filter((resource) => (resource.courseId ? courseIds.includes(resource.courseId) : true))
        .map(async (resource) => {
          const resolvedUrl = resource.storageId
            ? await ctx.storage.getUrl(resource.storageId)
            : (resource.url ?? null);
          return {
            ...resource,
            url: resolvedUrl,
            course: resource.courseId ? await ctx.db.get(resource.courseId) : null,
          };
        }),
    );

    return rows.sort(
      (a, b) => Number(b.isPinned) - Number(a.isPinned) || b.createdAt - a.createdAt,
    );
  },
});

export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const courseIds = await getViewerCourseIds(ctx, viewer._id);
    const announcements = sortByPublished(await ctx.db.query("announcements").collect());

    const rows = await Promise.all(
      announcements
        .filter((announcement) => matchesAudience(announcement.audienceRoles, viewer.roles))
        .filter((announcement) =>
          announcement.courseId ? courseIds.includes(announcement.courseId) : true,
        )
        .map(async (announcement) => ({
          ...announcement,
          course: announcement.courseId ? await ctx.db.get(announcement.courseId) : null,
        })),
    );

    return rows;
  },
});

export const getManagerOverview = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    if (!isPrivilegedRole(viewer)) {
      throw new Error("Manager overview is not available for student accounts.");
    }

    const [profiles, courses, announcements, resources, timetableEvents, surveys] =
      await Promise.all([
        ctx.db.query("profiles").collect(),
        ctx.db.query("courses").collect(),
        ctx.db.query("announcements").collect(),
        ctx.db.query("resources").collect(),
        ctx.db.query("timetableEvents").collect(),
        ctx.db.query("surveyTemplates").collect(),
      ]);

    const students = profiles.filter((profile) => profile.roles.includes("student"));
    const managers = profiles.filter((profile) => profile.roles.some((role) => role !== "student"));
    const upcomingEvents = timetableEvents
      .filter((event) => event.startsAt >= Date.now())
      .slice(0, 5);

    return {
      viewer,
      counts: {
        students: students.length,
        managers: managers.length,
        courses: courses.length,
        announcements: announcements.length,
        resources: resources.length,
        timetableEvents: timetableEvents.length,
        liveSurveys: surveys.filter((survey) => survey.status === "live").length,
      },
      latestAnnouncements: sortByPublished(announcements).slice(0, 4),
      upcomingEvents,
    };
  },
});

export const createAnnouncement = mutation({
  args: {
    courseCode: v.optional(v.string()),
    title: v.string(),
    body: v.string(),
    category: v.union(
      v.literal("general"),
      v.literal("reschedule"),
      v.literal("assessment"),
      v.literal("event"),
      v.literal("wellness"),
      v.literal("system"),
    ),
    audienceRoles: v.array(
      v.union(
        v.literal("student"),
        v.literal("lecturer"),
        v.literal("classRep"),
        v.literal("departmentAdmin"),
        v.literal("researcher"),
      ),
    ),
    linkUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    const now = Date.now();
    const course = args.courseCode
      ? await ctx.db
          .query("courses")
          .withIndex("by_code", (query) => query.eq("code", args.courseCode!.trim().toUpperCase()))
          .unique()
      : null;

    const announcementId = await ctx.db.insert("announcements", {
      courseId: course?._id,
      title: args.title.trim(),
      body: args.body.trim(),
      category: args.category,
      publishedAt: now,
      pinUntil: now + 3 * 24 * 60 * 60 * 1000,
      audienceRoles: args.audienceRoles,
      postedByProfileId: actor._id,
      linkUrl: args.linkUrl,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: actor._id,
      assignmentId: undefined,
      eventType: "content_created",
      eventAt: now,
      payload: { type: "announcement", title: args.title, courseCode: course?.code ?? null },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(announcementId);
  },
});

export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found.");
    }
    await ctx.db.delete(args.announcementId);
    return { deletedId: args.announcementId };
  },
});

export const createResource = mutation({
  args: {
    courseCode: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    kind: v.union(
      v.literal("lecture-note"),
      v.literal("slides"),
      v.literal("recording"),
      v.literal("reading"),
      v.literal("link"),
      v.literal("template"),
      v.literal("form"),
    ),
    url: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    audienceRoles: v.array(
      v.union(
        v.literal("student"),
        v.literal("lecturer"),
        v.literal("classRep"),
        v.literal("departmentAdmin"),
        v.literal("researcher"),
      ),
    ),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    if (!args.url && !args.storageId) {
      throw new Error("Resource must include either a URL or an uploaded file.");
    }
    const now = Date.now();
    const course = args.courseCode
      ? await ctx.db
          .query("courses")
          .withIndex("by_code", (query) => query.eq("code", args.courseCode!.trim().toUpperCase()))
          .unique()
      : null;

    const resourceId = await ctx.db.insert("resources", {
      courseId: course?._id,
      title: args.title.trim(),
      description: args.description,
      kind: args.kind,
      url: args.url,
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      isPinned: args.isPinned,
      audienceRoles: args.audienceRoles,
      uploadedByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: actor._id,
      assignmentId: undefined,
      eventType: "content_created",
      eventAt: now,
      payload: { type: "resource", title: args.title, courseCode: course?.code ?? null },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(resourceId);
  },
});

export const deleteResource = mutation({
  args: { resourceId: v.id("resources") },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) {
      throw new Error("Resource not found.");
    }
    if (resource.storageId) {
      await ctx.storage.delete(resource.storageId);
    }
    await ctx.db.delete(args.resourceId);
    return { deletedId: args.resourceId };
  },
});

export const generateResourceUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await ensureManagementAccess(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const createTimetableEvent = mutation({
  args: {
    courseCode: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.number(),
    venue: v.optional(v.string()),
    kind: v.union(
      v.literal("lecture"),
      v.literal("tutorial"),
      v.literal("lab"),
      v.literal("exam"),
      v.literal("office-hours"),
      v.literal("reschedule"),
      v.literal("event"),
      v.literal("deadline"),
    ),
    audienceRoles: v.array(
      v.union(
        v.literal("student"),
        v.literal("lecturer"),
        v.literal("classRep"),
        v.literal("departmentAdmin"),
        v.literal("researcher"),
      ),
    ),
    isRescheduled: v.boolean(),
    originalStartsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    const now = Date.now();
    const course = args.courseCode
      ? await ctx.db
          .query("courses")
          .withIndex("by_code", (query) => query.eq("code", args.courseCode!.trim().toUpperCase()))
          .unique()
      : null;

    const eventId = await ctx.db.insert("timetableEvents", {
      courseId: course?._id,
      title: args.title.trim(),
      description: args.description,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      venue: args.venue,
      kind: args.kind,
      isRescheduled: args.isRescheduled,
      originalStartsAt: args.originalStartsAt,
      audienceRoles: args.audienceRoles,
      cohortLabel: undefined,
      createdByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: actor._id,
      assignmentId: undefined,
      eventType: "content_created",
      eventAt: now,
      payload: { type: "timetable", title: args.title, courseCode: course?.code ?? null },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(eventId);
  },
});

export const getLiveSurvey = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const surveys = await ctx.db
      .query("surveyTemplates")
      .withIndex("by_status", (query) => query.eq("status", "live"))
      .collect();

    return surveys.find((survey) => matchesAudience(survey.audienceRoles, viewer.roles)) ?? null;
  },
});

export const submitSurveyResponse = mutation({
  args: {
    surveyTemplateId: v.id("surveyTemplates"),
    answers: v.array(
      v.object({
        questionId: v.string(),
        value: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const survey = await ctx.db.get(args.surveyTemplateId);
    if (!survey || survey.status !== "live") {
      throw new Error("Survey is not available.");
    }

    const existing = await ctx.db
      .query("surveyResponses")
      .withIndex("by_survey_respondent", (query) =>
        query.eq("surveyTemplateId", args.surveyTemplateId).eq("respondentProfileId", viewer._id),
      )
      .unique();

    if (existing) {
      throw new Error("Survey already submitted.");
    }

    const submittedAt = Date.now();
    const responseId = await ctx.db.insert("surveyResponses", {
      surveyTemplateId: args.surveyTemplateId,
      respondentProfileId: viewer._id,
      submittedAt,
      answers: args.answers,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: viewer._id,
      assignmentId: undefined,
      eventType: "survey_submitted",
      eventAt: submittedAt,
      payload: { surveyTemplateId: args.surveyTemplateId },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(responseId);
  },
});
