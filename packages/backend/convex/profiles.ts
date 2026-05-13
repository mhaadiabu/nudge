import { v } from "convex/values";

import { authComponent, extractStudentIdFromEmail, inferRoleFromEmail } from "./auth";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  ensureManagementAccess,
  getIdentityEmail,
  getIdentityName,
  getIdentityOrThrow,
  getViewerProfile,
  isPrivilegedRole,
} from "./lib/auth";

export const ensureViewer = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentityOrThrow(ctx);
    const authUser = await authComponent.safeGetAuthUser(ctx);
    const now = Date.now();
    const email = authUser?.email ?? getIdentityEmail(identity);
    const fullName = authUser?.name ?? getIdentityName(identity);
    const avatarUrl = authUser?.image ?? undefined;

    const existingBySubject = await getViewerProfile(ctx);
    if (existingBySubject) {
      await ctx.db.patch(existingBySubject._id, {
        email,
        fullName: fullName || existingBySubject.fullName,
        avatarUrl: avatarUrl || existingBySubject.avatarUrl,
        lastActiveAt: now,
        updatedAt: now,
      });
      await createDefaultNotificationSettingsIfMissing(ctx, existingBySubject._id, now);
      return await ctx.db.get(existingBySubject._id);
    }

    const existingByEmail = await ctx.db
      .query("profiles")
      .withIndex("by_email", (query) => query.eq("email", email))
      .unique();

    if (existingByEmail) {
      await ctx.db.patch(existingByEmail._id, {
        authSubject: identity.subject,
        fullName: fullName || existingByEmail.fullName,
        avatarUrl: avatarUrl || existingByEmail.avatarUrl,
        lastActiveAt: now,
        updatedAt: now,
      });
      await createDefaultNotificationSettingsIfMissing(ctx, existingByEmail._id, now);
      return await ctx.db.get(existingByEmail._id);
    }

    const roles = inferRoleFromEmail(email);
    const primaryRole = roles[0];
    const studentId = extractStudentIdFromEmail(email);
    const id = await ctx.db.insert("profiles", {
      authSubject: identity.subject,
      email,
      fullName,
      avatarUrl,
      roles,
      primaryRole,
      studentId,
      programme: undefined,
      level: undefined,
      consentStatus: "pending",
      preferredReminderHour: 18,
      timezone: "Africa/Accra",
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await createDefaultNotificationSettingsIfMissing(ctx, id, now);
    return await ctx.db.get(id);
  },
});

async function createDefaultNotificationSettingsIfMissing(
  ctx: MutationCtx,
  profileId: Doc<"profiles">["_id"],
  now: number,
) {
  const settings = await ctx.db
    .query("notificationSettings")
    .withIndex("by_profile", (query) => query.eq("profileId", profileId))
    .unique();

  if (settings) {
    return settings;
  }

  const id = await ctx.db.insert("notificationSettings", {
    profileId,
    digestEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    motivationEnabled: true,
    socialNormsEnabled: true,
    commitmentEnabled: true,
    timetableRemindersEnabled: true,
    assignmentRemindersEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "06:00",
    createdAt: now,
    updatedAt: now,
  });

  return await ctx.db.get(id);
}

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    return getViewerProfile(ctx);
  },
});

export const getViewerSettings = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getViewerProfile(ctx);
    if (!profile) {
      return null;
    }

    const settings = await ctx.db
      .query("notificationSettings")
      .withIndex("by_profile", (query) => query.eq("profileId", profile._id))
      .unique();

    return {
      profile,
      settings,
    };
  },
});

export const listPeople = query({
  args: {},
  handler: async (ctx) => {
    await ensureManagementAccess(ctx);
    const people = await ctx.db.query("profiles").collect();
    return people
      .sort((a, b) =>
        a.primaryRole === b.primaryRole ? a.email.localeCompare(b.email) : a.primaryRole.localeCompare(b.primaryRole),
      )
      .map((person) => ({
        _id: person._id,
        fullName: person.fullName,
        email: person.email,
        roles: person.roles,
        primaryRole: person.primaryRole,
        studentId: person.studentId,
        programme: person.programme,
        level: person.level,
        consentStatus: person.consentStatus,
      }));
  },
});

export const updateViewerConsent = mutation({
  args: {
    granted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await getViewerProfile(ctx);
    if (!profile) {
      throw new Error("Profile not initialized.");
    }

    const now = Date.now();
    const consentStatus: Doc<"profiles">["consentStatus"] = args.granted ? "granted" : "declined";
    await ctx.db.patch(profile._id, {
      consentStatus,
      consentedAt: args.granted ? now : undefined,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: profile._id,
      assignmentId: undefined,
      eventType: "consent_updated",
      eventAt: now,
      payload: { granted: args.granted },
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(profile._id);
  },
});

export const completeOnboarding = mutation({
  args: {
    preferredReminderHour: v.optional(v.number()),
    timezone: v.optional(v.string()),
    programme: v.optional(v.string()),
    level: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await getViewerProfile(ctx);
    if (!profile) {
      throw new Error("Profile not initialized.");
    }

    const now = Date.now();
    await ctx.db.patch(profile._id, {
      preferredReminderHour: args.preferredReminderHour ?? profile.preferredReminderHour,
      timezone: args.timezone ?? profile.timezone,
      programme: args.programme ?? profile.programme,
      level: args.level ?? profile.level,
      onboardingCompletedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: profile._id,
      assignmentId: undefined,
      eventType: "onboarding_completed",
      eventAt: now,
      payload: args,
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(profile._id);
  },
});

export const updateViewerSettings = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const profile = await getViewerProfile(ctx);
    if (!profile) {
      throw new Error("Profile not initialized.");
    }

    const settings = await createDefaultNotificationSettingsIfMissing(ctx, profile._id, Date.now());
    if (!settings) {
      throw new Error("Notification settings unavailable.");
    }

    const now = Date.now();
    await ctx.db.patch(settings._id, {
      ...args,
      updatedAt: now,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: profile._id,
      assignmentId: undefined,
      eventType: "settings_updated",
      eventAt: now,
      payload: args,
      experimentId: undefined,
      groupId: undefined,
    });

    return await ctx.db.get(settings._id);
  },
});

export const setRole = mutation({
  args: {
    profileId: v.id("profiles"),
    role: v.union(
      v.literal("student"),
      v.literal("lecturer"),
      v.literal("classRep"),
      v.literal("departmentAdmin"),
      v.literal("researcher"),
    ),
    asPrimary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    const target = await ctx.db.get(args.profileId);
    if (!target) {
      throw new Error("Profile not found.");
    }

    const isActorLecturer = actor.roles.includes("lecturer") && actor.roles.length === 1;
    if (isActorLecturer && args.role !== "student") {
      throw new Error("Lecturers can only demote or restore student roles.");
    }

    const isActorPrivileged = isPrivilegedRole(actor);
    if (!isActorPrivileged && args.role !== "student") {
      throw new Error("Insufficient permission to assign elevated roles.");
    }

    const now = Date.now();
    const newRoles = args.asPrimary
      ? [args.role, ...target.roles.filter((r) => r !== args.role)].slice(0, 2)
      : target.roles.includes(args.role)
      ? target.roles
      : [...target.roles, args.role].slice(0, 2);

    const newPrimaryRole = args.asPrimary ? args.role : target.primaryRole;
    const patch: {
      roles: typeof newRoles;
      primaryRole: typeof newPrimaryRole;
      studentId?: string;
      updatedAt: number;
    } = {
      roles: newRoles,
      primaryRole: newPrimaryRole,
      updatedAt: now,
    };

    if (args.role === "student" && !target.studentId) {
      const localPart = target.email.split("@")[0] ?? "";
      const cleanPart = localPart.replace(/[^a-z0-9]/gi, "");
      if (/^\d{8}$/.test(cleanPart)) {
        patch.studentId = `UPSA-${cleanPart}`;
      }
    }

    await ctx.db.patch(target._id, patch);
    return await ctx.db.get(target._id);
  },
});
