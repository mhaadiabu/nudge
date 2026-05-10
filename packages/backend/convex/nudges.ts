import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { getViewerProfileOrThrow } from "./lib/auth";
import { computeHoursUntilDue } from "./lib/assignment";
import { chooseNudgePlan, deriveBehaviorSignals, pickNudgeCopy } from "./lib/nudgeLogic";
import { HOUR_MS } from "./lib/time";

function formatDueLabel(dueAt: number) {
  return new Date(dueAt).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function interpolateTemplateBody(
  templateBody: string,
  assignmentTitle: string,
  dueAtLabel: string,
) {
  return templateBody
    .replaceAll("{{assignment}}", assignmentTitle)
    .replaceAll("{{dueAt}}", dueAtLabel);
}

async function resolveExperimentContext(ctx: MutationCtx, studentProfileId: Id<"profiles">) {
  const assignments = await ctx.db
    .query("experimentAssignments")
    .withIndex("by_student", (query) => query.eq("studentProfileId", studentProfileId))
    .collect();

  const runningAssignments: Array<Doc<"experimentAssignments">> = [];
  for (const assignment of assignments) {
    const experiment = await ctx.db.get(assignment.experimentId);
    if (experiment?.status === "running") {
      runningAssignments.push(assignment);
    }
  }

  if (runningAssignments.length === 0) return null;

  const latest = runningAssignments.sort((a, b) => b.assignedAt - a.assignedAt)[0];
  const group = latest ? await ctx.db.get(latest.groupId) : null;
  if (!latest || !group) return null;

  return {
    experimentId: latest.experimentId,
    groupId: latest.groupId,
    strategyId: group.strategyId,
    groupName: group.name,
  };
}

export const listForViewer = query({
  args: {
    includeScheduled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const all = await ctx.db
      .query("nudgeEvents")
      .withIndex("by_student_scheduled", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const includeScheduled = args.includeScheduled ?? true;
    const filtered = includeScheduled
      ? all
      : all.filter((event) => event.deliveryStatus !== "scheduled");

    return filtered
      .sort((a, b) => b.scheduledFor - a.scheduledFor)
      .map((event) => ({
        _id: event._id,
        assignmentId: event.assignmentId,
        title: event.title,
        message: event.message,
        type: event.type,
        channel: event.channel,
        urgency: event.urgency,
        deliveryStatus: event.deliveryStatus,
        scheduledFor: event.scheduledFor,
        sentAt: event.sentAt,
        openedAt: event.openedAt,
        adaptationReason: event.adaptationReason,
        metadata: event.metadata,
      }));
  },
});

export const getViewerNudgeSummary = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const events = await ctx.db
      .query("nudgeEvents")
      .withIndex("by_student_scheduled", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const sent = events.filter(
      (event) => event.deliveryStatus === "sent" || event.deliveryStatus === "opened",
    );
    const opened = events.filter((event) => event.deliveryStatus === "opened");
    const pending = events.filter((event) => event.deliveryStatus === "scheduled");

    return {
      total: events.length,
      sentCount: sent.length,
      openedCount: opened.length,
      scheduledCount: pending.length,
      openRate: sent.length === 0 ? 0 : opened.length / sent.length,
    };
  },
});

export const markOpened = mutation({
  args: {
    nudgeEventId: v.id("nudgeEvents"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const event = await ctx.db.get(args.nudgeEventId);
    if (!event || event.studentProfileId !== viewer._id) {
      throw new Error("Nudge event not found.");
    }

    const now = Date.now();
    await ctx.db.patch(event._id, {
      openedAt: now,
      deliveryStatus: "opened",
      updatedAt: now,
      sentAt: event.sentAt ?? now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: viewer._id,
      assignmentId: event.assignmentId,
      eventType: "nudge_opened",
      eventAt: now,
      payload: { nudgeEventId: event._id, type: event.type },
      experimentId: event.experimentId,
      groupId: event.groupId,
    });

    return await ctx.db.get(event._id);
  },
});

export const dispatchDueNudges = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const now = Date.now();
    const due = await ctx.db
      .query("nudgeEvents")
      .withIndex("by_student_scheduled", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const dueScheduled = due.filter(
      (event) => event.deliveryStatus === "scheduled" && event.scheduledFor <= now,
    );

    for (const event of dueScheduled) {
      await ctx.db.patch(event._id, {
        deliveryStatus: "sent",
        sentAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("activityEvents", {
        studentProfileId: viewer._id,
        assignmentId: event.assignmentId,
        eventType: "nudge_sent",
        eventAt: now,
        payload: { nudgeEventId: event._id, type: event.type, channel: event.channel },
        experimentId: event.experimentId,
        groupId: event.groupId,
      });
    }

    return { sentNow: dueScheduled.length };
  },
});

export const generateForViewer = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const now = Date.now();

    const settings = await ctx.db
      .query("notificationSettings")
      .withIndex("by_profile", (query) => query.eq("profileId", viewer._id))
      .unique();

    const recipients = await ctx.db
      .query("assignmentRecipients")
      .withIndex("by_student_due", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const candidateRecipients = recipients.filter(
      (recipient) => recipient.status !== "submitted" && recipient.assignmentDueAt >= now,
    );
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_student", (query) => query.eq("studentProfileId", viewer._id))
      .collect();
    const existingEvents = await ctx.db
      .query("nudgeEvents")
      .withIndex("by_student_scheduled", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const experimentContext = await resolveExperimentContext(ctx, viewer._id);
    const signals = deriveBehaviorSignals(
      submissions,
      existingEvents,
      (settings?.socialNormsEnabled ?? false) ||
        experimentContext?.groupName?.toLowerCase().includes("social") === true,
    );
    const activeStrategies = await ctx.db
      .query("nudgeStrategies")
      .withIndex("by_active", (query) => query.eq("isActive", true))
      .collect();

    const createdIds: Id<"nudgeEvents">[] = [];
    for (const recipient of candidateRecipients) {
      const assignment = await ctx.db.get(recipient.assignmentId);
      if (!assignment) continue;

      const hoursUntilDue = computeHoursUntilDue(assignment.dueAt, now);
      const plan = chooseNudgePlan(hoursUntilDue, signals);
      const strategy = experimentContext?.strategyId
        ? await ctx.db.get(experimentContext.strategyId)
        : (activeStrategies.find((item) => item.type === plan.type) ?? activeStrategies[0]);

      if (!strategy) continue;

      const templates = await ctx.db
        .query("nudgeTemplates")
        .withIndex("by_strategy_active", (query) =>
          query.eq("strategyId", strategy._id).eq("isActive", true),
        )
        .collect();

      const dueLabel = formatDueLabel(assignment.dueAt);
      const fallbackCopy = pickNudgeCopy(plan.type, plan.tone, assignment.title, dueLabel);

      for (const offsetHours of plan.scheduleOffsetsHours) {
        const scheduledFor = assignment.dueAt - offsetHours * HOUR_MS;
        if (scheduledFor < now && !args.force) continue;

        const duplicate = existingEvents.find(
          (existing) =>
            existing.assignmentId === assignment._id &&
            existing.type === plan.type &&
            Math.abs(existing.scheduledFor - scheduledFor) < HOUR_MS,
        );
        if (duplicate && !args.force) continue;

        const template = templates.find(
          (candidate) =>
            candidate.tone === plan.tone &&
            offsetHours >= candidate.minHoursBeforeDue &&
            offsetHours <= candidate.maxHoursBeforeDue,
        );

        const title = template?.title ?? fallbackCopy.title;
        const message = template
          ? interpolateTemplateBody(template.body, assignment.title, dueLabel)
          : fallbackCopy.message;

        const nudgeId = await ctx.db.insert("nudgeEvents", {
          studentProfileId: viewer._id,
          assignmentId: assignment._id,
          strategyId: strategy._id,
          templateId: template?._id,
          experimentId: experimentContext?.experimentId,
          groupId: experimentContext?.groupId,
          type: plan.type,
          channel:
            plan.channel === "push" && settings?.pushEnabled === false ? "in-app" : plan.channel,
          title,
          message,
          urgency: plan.urgency,
          scheduledFor,
          sentAt: undefined,
          openedAt: undefined,
          deliveryStatus: scheduledFor <= now ? "sent" : "scheduled",
          adaptationReason: plan.adaptationReason,
          metadata: { offsetHours, signals },
          createdAt: now,
          updatedAt: now,
        });

        if (scheduledFor <= now) {
          await ctx.db.patch(nudgeId, { sentAt: now, updatedAt: now });
          await ctx.db.insert("activityEvents", {
            studentProfileId: viewer._id,
            assignmentId: assignment._id,
            eventType: "nudge_sent",
            eventAt: now,
            payload: { nudgeEventId: nudgeId, type: plan.type, channel: plan.channel },
            experimentId: experimentContext?.experimentId,
            groupId: experimentContext?.groupId,
          });
        }

        createdIds.push(nudgeId);
      }
    }

    return { generatedCount: createdIds.length, generatedIds: createdIds };
  },
});
