import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { ensureManagementAccess, getViewerProfileOrThrow } from "./lib/auth";
import {
  calculateLeadTimeHours,
  isOnTimeSubmission,
  resolveAssignmentStatus,
} from "./lib/assignment";
import { computeSubmissionMetrics } from "./lib/metrics";

const assignmentStatusArg = v.optional(
  v.union(
    v.literal("upcoming"),
    v.literal("dueSoon"),
    v.literal("overdue"),
    v.literal("submitted"),
  ),
);

async function getStudentAssignmentRows(ctx: QueryCtx, studentProfileId: Id<"profiles">) {
  const recipients = await ctx.db
    .query("assignmentRecipients")
    .withIndex("by_student_due", (query) => query.eq("studentProfileId", studentProfileId))
    .collect();

  const now = Date.now();
  const rows = await Promise.all(
    recipients.map(async (recipient) => {
      const assignment = await ctx.db.get(recipient.assignmentId);
      if (!assignment) {
        return null;
      }

      const submission = await ctx.db
        .query("submissions")
        .withIndex("by_assignment_student", (query) =>
          query
            .eq("assignmentId", recipient.assignmentId)
            .eq("studentProfileId", recipient.studentProfileId),
        )
        .first();

      const computedStatus = resolveAssignmentStatus({
        dueAt: assignment.dueAt,
        submittedAt: submission?.submittedAt,
        now,
      });

      return {
        recipient,
        assignment,
        submission: submission ?? null,
        computedStatus,
      };
    }),
  );

  return rows.filter((row) => row !== null);
}

export const listForViewer = query({
  args: {
    status: assignmentStatusArg,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const rows = await getStudentAssignmentRows(ctx, viewer._id);

    const search = args.search?.trim().toLowerCase();
    const filtered = rows
      .filter((row) => (args.status ? row.computedStatus === args.status : true))
      .filter((row) => {
        if (!search) {
          return true;
        }
        return (
          row.assignment.title.toLowerCase().includes(search) ||
          row.assignment.courseCode.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => a.assignment.dueAt - b.assignment.dueAt);

    return filtered.map((row) => ({
      assignmentRecipientId: row.recipient._id,
      assignmentId: row.assignment._id,
      title: row.assignment.title,
      description: row.assignment.description,
      courseCode: row.assignment.courseCode,
      dueAt: row.assignment.dueAt,
      status: row.computedStatus,
      lastViewedAt: row.recipient.lastViewedAt,
      submittedAt: row.submission?.submittedAt,
      isOnTime: row.submission?.isOnTime ?? null,
      leadTimeHours: row.submission?.leadTimeHours ?? null,
      linkUrl: row.assignment.linkUrl,
      weight: row.assignment.weight,
    }));
  },
});

export const markViewed = mutation({
  args: {
    assignmentRecipientId: v.id("assignmentRecipients"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const recipient = await ctx.db.get(args.assignmentRecipientId);
    if (!recipient || recipient.studentProfileId !== viewer._id) {
      throw new Error("Assignment recipient record not found.");
    }

    const now = Date.now();
    await ctx.db.patch(recipient._id, {
      lastViewedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: viewer._id,
      assignmentId: recipient.assignmentId,
      eventType: "assignment_viewed",
      eventAt: now,
      payload: {
        assignmentRecipientId: recipient._id,
      },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(recipient._id);
  },
});

export const recordSubmission = mutation({
  args: {
    assignmentId: v.id("assignments"),
    submittedAt: v.optional(v.number()),
    status: v.optional(v.union(v.literal("submitted"), v.literal("resubmitted"))),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    const recipient = await ctx.db
      .query("assignmentRecipients")
      .withIndex("by_student_assignment", (query) =>
        query.eq("studentProfileId", viewer._id).eq("assignmentId", assignment._id),
      )
      .first();
    if (!recipient) {
      throw new Error("You are not mapped to this assignment.");
    }

    const now = Date.now();
    const submittedAt = args.submittedAt ?? now;
    const isOnTime = isOnTimeSubmission(assignment.dueAt, submittedAt);
    const leadTimeHours = calculateLeadTimeHours(assignment.dueAt, submittedAt);
    const submissionStatus = args.status ?? "submitted";

    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_assignment_student", (query) =>
        query.eq("assignmentId", assignment._id).eq("studentProfileId", viewer._id),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: submissionStatus,
        submittedAt,
        isOnTime,
        leadTimeHours,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("submissions", {
        assignmentId: assignment._id,
        studentProfileId: viewer._id,
        status: submissionStatus,
        submittedAt,
        isOnTime,
        leadTimeHours,
        sourceSystem: "manual",
        createdAt: now,
        updatedAt: now,
      });
    }

    const status = resolveAssignmentStatus({
      dueAt: assignment.dueAt,
      submittedAt,
      now,
    });
    await ctx.db.patch(recipient._id, {
      status,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: viewer._id,
      assignmentId: assignment._id,
      eventType: "submission_recorded",
      eventAt: now,
      payload: {
        submissionStatus,
        submittedAt,
        isOnTime,
        leadTimeHours,
      },
      experimentId: undefined,
      groupId: undefined,
    });

    return {
      assignmentId: assignment._id,
      status,
      submittedAt,
      isOnTime,
      leadTimeHours,
    };
  },
});

export const refreshViewerStatuses = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const recipients = await ctx.db
      .query("assignmentRecipients")
      .withIndex("by_student_due", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const now = Date.now();
    const changed: Array<{ assignmentId: string; previous: string; next: string }> = [];

    for (const recipient of recipients) {
      const assignment = await ctx.db.get(recipient.assignmentId);
      if (!assignment) {
        continue;
      }

      const submission = await ctx.db
        .query("submissions")
        .withIndex("by_assignment_student", (query) =>
          query.eq("assignmentId", assignment._id).eq("studentProfileId", viewer._id),
        )
        .first();

      const nextStatus = resolveAssignmentStatus({
        dueAt: assignment.dueAt,
        submittedAt: submission?.submittedAt,
        now,
      });

      if (nextStatus !== recipient.status) {
        await ctx.db.patch(recipient._id, {
          status: nextStatus,
          updatedAt: now,
        });
        changed.push({
          assignmentId: assignment._id,
          previous: recipient.status,
          next: nextStatus,
        });

        await ctx.db.insert("activityEvents", {
          studentProfileId: viewer._id,
          assignmentId: assignment._id,
          eventType: "assignment_status_changed",
          eventAt: now,
          payload: {
            previous: recipient.status,
            next: nextStatus,
          },
          experimentId: undefined,
          groupId: undefined,
        });
      }
    }

    return {
      changedCount: changed.length,
      changed,
    };
  },
});

export const getViewerProgress = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_student", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const metrics = computeSubmissionMetrics(submissions);

    const recipients = await ctx.db
      .query("assignmentRecipients")
      .withIndex("by_student_due", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const now = Date.now();
    let upcomingCount = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;
    let submittedCount = 0;

    for (const recipient of recipients) {
      const assignment = await ctx.db.get(recipient.assignmentId);
      if (!assignment) {
        continue;
      }
      const submission = submissions.find((item) => item.assignmentId === assignment._id);
      const status = resolveAssignmentStatus({
        dueAt: assignment.dueAt,
        submittedAt: submission?.submittedAt,
        now,
      });
      if (status === "upcoming") upcomingCount += 1;
      if (status === "dueSoon") dueSoonCount += 1;
      if (status === "overdue") overdueCount += 1;
      if (status === "submitted") submittedCount += 1;
    }

    const timelineBuckets = new Map<string, { total: number; onTime: number; missed: number }>();
    for (const submission of submissions) {
      const stamp = submission.submittedAt ?? submission.createdAt;
      const date = new Date(stamp);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = timelineBuckets.get(key) ?? { total: 0, onTime: 0, missed: 0 };
      bucket.total += 1;
      if (submission.status === "missed") {
        bucket.missed += 1;
      }
      if (submission.isOnTime) {
        bucket.onTime += 1;
      }
      timelineBuckets.set(key, bucket);
    }

    const timeline = [...timelineBuckets.entries()]
      .map(([period, value]) => ({
        period,
        total: value.total,
        onTimeRate: value.total === 0 ? 0 : value.onTime / value.total,
        missedRate: value.total === 0 ? 0 : value.missed / value.total,
      }))
      .sort((a, b) => (a.period < b.period ? -1 : 1));

    return {
      metrics,
      assignmentStateCounts: {
        upcoming: upcomingCount,
        dueSoon: dueSoonCount,
        overdue: overdueCount,
        submitted: submittedCount,
      },
      timeline,
    };
  },
});

export const createForCourse = mutation({
  args: {
    courseCode: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    dueAt: v.number(),
    weight: v.optional(v.number()),
    linkUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    const course = await ctx.db
      .query("courses")
      .withIndex("by_code", (query) => query.eq("code", args.courseCode.trim().toUpperCase()))
      .unique();
    if (!course) {
      throw new Error("Course not found.");
    }

    const now = Date.now();
    const assignmentId = await ctx.db.insert("assignments", {
      sourceSystem: "manager-console",
      sourceId: `manual-${now}`,
      title: args.title.trim(),
      description: args.description,
      courseId: course._id,
      courseCode: course.code,
      dueAt: args.dueAt,
      publishedAt: now,
      weight: args.weight,
      linkUrl: args.linkUrl,
      submissionMode: "digital",
      createdAt: now,
      updatedAt: now,
    });

    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course", (query) => query.eq("courseId", course._id))
      .collect();
    const studentEnrollments = enrollments.filter(
      (enrollment) => enrollment.roleInCourse === "student",
    );

    for (const enrollment of studentEnrollments) {
      await ctx.db.insert("assignmentRecipients", {
        assignmentId,
        studentProfileId: enrollment.profileId,
        sourceStudentRef: undefined,
        assignmentDueAt: args.dueAt,
        assignedAt: now,
        status: resolveAssignmentStatus({ dueAt: args.dueAt, now }),
        lastViewedAt: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("activityEvents", {
      studentProfileId: actor._id,
      assignmentId,
      eventType: "content_created",
      eventAt: now,
      payload: {
        type: "assignment",
        courseCode: course.code,
        title: args.title,
      },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(assignmentId);
  },
});

export const deleteForCourse = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    const recipients = await ctx.db
      .query("assignmentRecipients")
      .withIndex("by_assignment", (query) => query.eq("assignmentId", args.assignmentId))
      .collect();
    for (const recipient of recipients) {
      await ctx.db.delete(recipient._id);
    }

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_assignment", (query) => query.eq("assignmentId", args.assignmentId))
      .collect();
    for (const submission of submissions) {
      await ctx.db.delete(submission._id);
    }

    const nudgeEvents = await ctx.db
      .query("nudgeEvents")
      .withIndex("by_assignment", (query) => query.eq("assignmentId", args.assignmentId))
      .collect();
    for (const nudge of nudgeEvents) {
      await ctx.db.delete(nudge._id);
    }

    await ctx.db.delete(args.assignmentId);
    return { deletedId: args.assignmentId };
  },
});
