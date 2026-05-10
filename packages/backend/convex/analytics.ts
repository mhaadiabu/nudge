import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { query, type QueryCtx } from "./_generated/server";
import { ensureManagementAccess } from "./lib/auth";
import { computeSubmissionMetrics, createEmptySubmissionMetrics } from "./lib/metrics";

function normalizeMonth(stamp: number) {
  const date = new Date(stamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

type DashboardArgs = {
  cohortId?: Id<"cohorts">;
  experimentId?: Id<"experiments">;
  nudgeType?: Doc<"nudgeEvents">["type"];
};

async function resolveStudentIds(ctx: QueryCtx, args: DashboardArgs) {
  if (args.experimentId !== undefined) {
    const assignments = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_experiment_student", (query) => query.eq("experimentId", args.experimentId!))
      .collect();
    return [...new Set(assignments.map((assignment) => assignment.studentProfileId))];
  }

  if (args.cohortId !== undefined) {
    const members = await ctx.db
      .query("cohortMembers")
      .withIndex("by_cohort", (query) => query.eq("cohortId", args.cohortId!))
      .collect();
    return [...new Set(members.map((member) => member.studentProfileId))];
  }

  const students = await ctx.db
    .query("profiles")
    .withIndex("by_role", (query) => query.eq("role", "student"))
    .collect();
  return students.map((student) => student._id);
}

export const getDashboardSummary = query({
  args: {
    cohortId: v.optional(v.id("cohorts")),
    experimentId: v.optional(v.id("experiments")),
    nudgeType: v.optional(
      v.union(
        v.literal("deadline-reminder"),
        v.literal("escalating-urgency"),
        v.literal("personalized-timing"),
        v.literal("progress-status"),
        v.literal("motivational"),
        v.literal("commitment-style"),
        v.literal("social-norm"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const studentIds = await resolveStudentIds(ctx, args);
    if (studentIds.length === 0) {
      return {
        studentCount: 0,
        submissionMetrics: createEmptySubmissionMetrics(),
        nudgeMetrics: {
          sentCount: 0,
          openedCount: 0,
          openRate: 0,
          byType: [],
        },
      };
    }

    const submissions: Doc<"submissions">[] = [];
    const nudgeEvents: Doc<"nudgeEvents">[] = [];
    for (const studentId of studentIds) {
      submissions.push(
        ...(await ctx.db
          .query("submissions")
          .withIndex("by_student", (query) => query.eq("studentProfileId", studentId))
          .collect()),
      );
      nudgeEvents.push(
        ...(await ctx.db
          .query("nudgeEvents")
          .withIndex("by_student_scheduled", (query) => query.eq("studentProfileId", studentId))
          .collect()),
      );
    }

    const filteredNudges = args.nudgeType
      ? nudgeEvents.filter((event) => event.type === args.nudgeType)
      : nudgeEvents;
    const sentCount = filteredNudges.filter(
      (event) => event.deliveryStatus === "sent" || event.deliveryStatus === "opened",
    ).length;
    const openedCount = filteredNudges.filter((event) => event.deliveryStatus === "opened").length;

    const typeMap = new Map<Doc<"nudgeEvents">["type"], { sent: number; opened: number }>();
    for (const event of filteredNudges) {
      const existing = typeMap.get(event.type) ?? { sent: 0, opened: 0 };
      if (event.deliveryStatus === "sent" || event.deliveryStatus === "opened") {
        existing.sent += 1;
      }
      if (event.deliveryStatus === "opened") {
        existing.opened += 1;
      }
      typeMap.set(event.type, existing);
    }

    return {
      studentCount: studentIds.length,
      submissionMetrics: computeSubmissionMetrics(submissions),
      nudgeMetrics: {
        sentCount,
        openedCount,
        openRate: sentCount === 0 ? 0 : openedCount / sentCount,
        byType: [...typeMap.entries()].map(([type, value]) => ({
          type,
          sent: value.sent,
          opened: value.opened,
          openRate: value.sent === 0 ? 0 : value.opened / value.sent,
        })),
      },
    };
  },
});

export const getBehaviorTimeline = query({
  args: {
    cohortId: v.optional(v.id("cohorts")),
    experimentId: v.optional(v.id("experiments")),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const studentIds = await resolveStudentIds(ctx, args);
    const submissions: Doc<"submissions">[] = [];
    const nudges: Doc<"nudgeEvents">[] = [];

    for (const studentId of studentIds) {
      submissions.push(
        ...(await ctx.db
          .query("submissions")
          .withIndex("by_student", (query) => query.eq("studentProfileId", studentId))
          .collect()),
      );
      nudges.push(
        ...(await ctx.db
          .query("nudgeEvents")
          .withIndex("by_student_scheduled", (query) => query.eq("studentProfileId", studentId))
          .collect()),
      );
    }

    const bucket = new Map<
      string,
      {
        submissions: number;
        onTime: number;
        missed: number;
        nudgesSent: number;
        nudgesOpened: number;
      }
    >();

    for (const submission of submissions) {
      const key = normalizeMonth(submission.submittedAt ?? submission.createdAt);
      const row = bucket.get(key) ?? {
        submissions: 0,
        onTime: 0,
        missed: 0,
        nudgesSent: 0,
        nudgesOpened: 0,
      };
      row.submissions += 1;
      if (submission.status === "missed") row.missed += 1;
      if (submission.isOnTime) row.onTime += 1;
      bucket.set(key, row);
    }

    for (const nudge of nudges) {
      const key = normalizeMonth(nudge.scheduledFor);
      const row = bucket.get(key) ?? {
        submissions: 0,
        onTime: 0,
        missed: 0,
        nudgesSent: 0,
        nudgesOpened: 0,
      };
      if (nudge.deliveryStatus === "sent" || nudge.deliveryStatus === "opened") row.nudgesSent += 1;
      if (nudge.deliveryStatus === "opened") row.nudgesOpened += 1;
      bucket.set(key, row);
    }

    return [...bucket.entries()]
      .map(([period, row]) => ({
        period,
        submissions: row.submissions,
        onTimeRate: row.submissions === 0 ? 0 : row.onTime / row.submissions,
        missedRate: row.submissions === 0 ? 0 : row.missed / row.submissions,
        nudgesSent: row.nudgesSent,
        nudgeOpenRate: row.nudgesSent === 0 ? 0 : row.nudgesOpened / row.nudgesSent,
      }))
      .sort((a, b) => (a.period < b.period ? -1 : 1));
  },
});

export const listActivityLog = query({
  args: {
    limit: v.optional(v.number()),
    studentProfileId: v.optional(v.id("profiles")),
    eventType: v.optional(
      v.union(
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
      ),
    ),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const maxRows = Math.min(args.limit ?? 200, 500);
    let events = await ctx.db.query("activityEvents").collect();

    if (args.studentProfileId) {
      events = events.filter((event) => event.studentProfileId === args.studentProfileId);
    }
    if (args.eventType) {
      events = events.filter((event) => event.eventType === args.eventType);
    }

    return events
      .sort((a, b) => b.eventAt - a.eventAt)
      .slice(0, maxRows)
      .map((event) => ({
        _id: event._id,
        eventType: event.eventType,
        eventAt: event.eventAt,
        studentProfileId: event.studentProfileId,
        assignmentId: event.assignmentId,
        payload: event.payload,
        experimentId: event.experimentId,
        groupId: event.groupId,
      }));
  },
});
