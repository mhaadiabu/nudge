import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { ensureManagementAccess } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await ensureManagementAccess(ctx);
    const cohorts = await ctx.db.query("cohorts").collect();

    const enriched = await Promise.all(
      cohorts.map(async (cohort) => {
        const members = await ctx.db
          .query("cohortMembers")
          .withIndex("by_cohort", (query) => query.eq("cohortId", cohort._id))
          .collect();
        return {
          ...cohort,
          memberCount: members.length,
        };
      }),
    );

    return enriched.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    year: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    const now = Date.now();

    const id = await ctx.db.insert("cohorts", {
      name: args.name,
      description: args.description,
      year: args.year,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

export const setActive = mutation({
  args: {
    cohortId: v.id("cohorts"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ensureManagementAccess(ctx);
    await ctx.db.patch(args.cohortId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.cohortId);
  },
});
