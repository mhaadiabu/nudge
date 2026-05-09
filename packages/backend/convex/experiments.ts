import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { ensureManagementAccess } from "./lib/auth";
import { computeSubmissionMetrics, createEmptySubmissionMetrics } from "./lib/metrics";

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export const listStrategies = query({
  args: {},
  handler: async (ctx) => {
    await ensureManagementAccess(ctx);
    const strategies = await ctx.db.query("nudgeStrategies").collect();
    return strategies.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createStrategy = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("deadline-reminder"),
      v.literal("escalating-urgency"),
      v.literal("personalized-timing"),
      v.literal("progress-status"),
      v.literal("motivational"),
      v.literal("commitment-style"),
      v.literal("social-norm"),
    ),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("nudgeStrategies", {
      name: args.name,
      description: args.description,
      type: args.type,
      config: args.config,
      isActive: true,
      createdByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const setStrategyActive = mutation({
  args: {
    strategyId: v.id("nudgeStrategies"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    await ctx.db.patch(args.strategyId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.strategyId);
  },
});

export const listTemplates = query({
  args: {
    strategyId: v.optional(v.id("nudgeStrategies")),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    if (args.strategyId !== undefined) {
      return ctx.db
        .query("nudgeTemplates")
        .withIndex("by_strategy", (query) => query.eq("strategyId", args.strategyId!))
        .collect();
    }
    return ctx.db.query("nudgeTemplates").collect();
  },
});

export const createTemplate = mutation({
  args: {
    strategyId: v.id("nudgeStrategies"),
    title: v.string(),
    body: v.string(),
    channel: v.union(v.literal("in-app"), v.literal("push")),
    tone: v.union(
      v.literal("neutral"),
      v.literal("urgent"),
      v.literal("motivational"),
      v.literal("commitment"),
    ),
    minHoursBeforeDue: v.number(),
    maxHoursBeforeDue: v.number(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("nudgeTemplates", {
      strategyId: args.strategyId,
      title: args.title,
      body: args.body,
      channel: args.channel,
      tone: args.tone,
      minHoursBeforeDue: args.minHoursBeforeDue,
      maxHoursBeforeDue: args.maxHoursBeforeDue,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const createExperiment = mutation({
  args: {
    name: v.string(),
    hypothesis: v.optional(v.string()),
    cohortId: v.id("cohorts"),
    startAt: v.optional(v.number()),
    endAt: v.optional(v.number()),
    groups: v.array(
      v.object({
        name: v.string(),
        strategyId: v.id("nudgeStrategies"),
        allocationPercentage: v.number(),
      }),
    ),
    assignmentMethod: v.optional(v.union(v.literal("random"), v.literal("manual"))),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    const totalAllocation = args.groups.reduce((sum, group) => sum + group.allocationPercentage, 0);
    if (Math.abs(totalAllocation - 100) > 0.0001) {
      throw new Error("Group allocation percentages must add up to 100.");
    }

    const now = Date.now();
    const experimentId = await ctx.db.insert("experiments", {
      name: args.name,
      hypothesis: args.hypothesis,
      status: "draft",
      cohortId: args.cohortId,
      startAt: args.startAt,
      endAt: args.endAt,
      createdByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    const groupIds = await Promise.all(
      args.groups.map((group) =>
        ctx.db.insert("experimentGroups", {
          experimentId,
          name: group.name,
          strategyId: group.strategyId,
          allocationPercentage: group.allocationPercentage,
          createdAt: now,
        }),
      ),
    );

    const members = await ctx.db
      .query("cohortMembers")
      .withIndex("by_cohort", (query) => query.eq("cohortId", args.cohortId))
      .collect();

    if (args.assignmentMethod !== "manual") {
      const membersSorted = [...members].sort((a, b) =>
        a.studentProfileId < b.studentProfileId ? -1 : 1,
      );
      let indexPointer = 0;
      for (let index = 0; index < args.groups.length; index += 1) {
        const group = args.groups[index];
        const groupId = groupIds[index];
        if (!groupId) {
          continue;
        }
        const memberCount =
          index === args.groups.length - 1
            ? membersSorted.length - indexPointer
            : Math.round((group.allocationPercentage / 100) * membersSorted.length);

        const assignedSlice = membersSorted.slice(indexPointer, indexPointer + memberCount);
        for (const member of assignedSlice) {
          await ctx.db.insert("experimentAssignments", {
            experimentId,
            groupId,
            studentProfileId: member.studentProfileId,
            assignedAt: now,
            assignmentMethod: "random",
          });
        }
        indexPointer += memberCount;
      }
    }

    return { experimentId, groupIds };
  },
});

export const setExperimentStatus = mutation({
  args: {
    experimentId: v.id("experiments"),
    status: v.union(v.literal("draft"), v.literal("running"), v.literal("paused"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    await ctx.db.patch(args.experimentId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.experimentId);
  },
});

export const listExperiments = query({
  args: {},
  handler: async (ctx) => {
    await ensureManagementAccess(ctx);
    const experiments = await ctx.db.query("experiments").collect();

    const rows = await Promise.all(
      experiments.map(async (experiment) => {
        const groups = await ctx.db
          .query("experimentGroups")
          .withIndex("by_experiment", (query) => query.eq("experimentId", experiment._id))
          .collect();
        const assignments = await ctx.db
          .query("experimentAssignments")
          .withIndex("by_experiment_student", (query) => query.eq("experimentId", experiment._id))
          .collect();
        return {
          ...experiment,
          groups,
          participantCount: assignments.length,
        };
      }),
    );

    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getExperimentComparison = query({
  args: {
    experimentId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const experiment = await ctx.db.get(args.experimentId);
    if (!experiment) {
      return null;
    }

    const groups = await ctx.db
      .query("experimentGroups")
      .withIndex("by_experiment", (query) => query.eq("experimentId", experiment._id))
      .collect();
    const assignments = await ctx.db
      .query("experimentAssignments")
      .withIndex("by_experiment_student", (query) => query.eq("experimentId", experiment._id))
      .collect();
    const nudgeEvents = await ctx.db
      .query("nudgeEvents")
      .withIndex("by_experiment", (query) => query.eq("experimentId", experiment._id))
      .collect();

    const byGroup = await Promise.all(
      groups.map(async (group) => {
        const studentIds = assignments
          .filter((assignment) => assignment.groupId === group._id)
          .map((assignment) => assignment.studentProfileId);

        const submissions: Doc<"submissions">[] = [];
        for (const studentId of studentIds) {
          submissions.push(
            ...(await ctx.db
              .query("submissions")
              .withIndex("by_student", (query) => query.eq("studentProfileId", studentId))
              .collect()),
          );
        }

        const metrics =
          studentIds.length > 0
            ? computeSubmissionMetrics(submissions)
            : createEmptySubmissionMetrics();
        const groupNudges = nudgeEvents.filter((event) => event.groupId === group._id);
        const sent = groupNudges.filter(
          (event) => event.deliveryStatus === "sent" || event.deliveryStatus === "opened",
        );
        const opened = groupNudges.filter((event) => event.deliveryStatus === "opened");

        return {
          groupId: group._id,
          groupName: group.name,
          strategyId: group.strategyId,
          participants: studentIds.length,
          onTimeRate: roundToTwo(metrics.onTimeRate * 100),
          missedRate: roundToTwo(metrics.missedRate * 100),
          avgLeadHours: roundToTwo(metrics.avgLeadHours),
          overdueCount: metrics.overdueCount,
          nudgeSentCount: sent.length,
          nudgeOpenRate: sent.length === 0 ? 0 : roundToTwo((opened.length / sent.length) * 100),
        };
      }),
    );

    return {
      experiment,
      groups: byGroup,
    };
  },
});
