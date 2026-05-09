import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { ensureManagementAccess } from "./lib/auth";

export const listSourceConfigs = query({
  args: {},
  handler: async (ctx) => {
    await ensureManagementAccess(ctx);
    const configs = await ctx.db.query("sourceConfigs").collect();
    return configs.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const upsertSourceConfig = mutation({
  args: {
    sourceType: v.union(v.literal("assignment"), v.literal("submission"), v.literal("timetable")),
    systemName: v.string(),
    accessMethod: v.union(v.literal("api"), v.literal("database"), v.literal("import")),
    minReliableFields: v.array(v.string()),
    status: v.union(v.literal("pending"), v.literal("confirmed")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("sourceConfigs")
      .withIndex("by_sourceType", (query) => query.eq("sourceType", args.sourceType))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedByProfileId: actor._id,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("sourceConfigs", {
      ...args,
      updatedByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const getPhaseZeroReadiness = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("sourceConfigs").collect();
    const assignmentConfig = configs.find((config) => config.sourceType === "assignment");
    const submissionConfig = configs.find((config) => config.sourceType === "submission");
    const timetableConfig = configs.find((config) => config.sourceType === "timetable");

    const hasAssignmentSource = assignmentConfig?.status === "confirmed";
    const hasSubmissionSource = submissionConfig?.status === "confirmed";
    const hasTimetableSource = timetableConfig?.status === "confirmed";

    return {
      assignmentSource: assignmentConfig ?? null,
      submissionSource: submissionConfig ?? null,
      timetableSource: timetableConfig ?? null,
      hasAssignmentSource,
      hasSubmissionSource,
      hasTimetableSource,
      isReady: hasAssignmentSource && hasSubmissionSource && hasTimetableSource,
      openQuestions: {
        assignmentSourceSystem: hasAssignmentSource,
        submissionSourceSystem: hasSubmissionSource,
        timetableSourceSystem: hasTimetableSource,
        accessMethod:
          Boolean(assignmentConfig?.accessMethod) &&
          Boolean(submissionConfig?.accessMethod) &&
          Boolean(timetableConfig?.accessMethod),
        minimumReliableFields:
          (assignmentConfig?.minReliableFields.length ?? 0) >= 4 &&
          (submissionConfig?.minReliableFields.length ?? 0) >= 3 &&
          (timetableConfig?.minReliableFields.length ?? 0) >= 4,
        experimentSetupRequirements: true,
      },
    };
  },
});
