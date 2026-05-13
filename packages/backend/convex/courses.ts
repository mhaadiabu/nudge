import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { ensureManagementAccess, getViewerProfileOrThrow, isPrivilegedRole } from "./lib/auth";

export const listForViewer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);

    const enrollments = isPrivilegedRole(viewer)
      ? await ctx.db.query("courseEnrollments").collect()
      : await ctx.db
          .query("courseEnrollments")
          .withIndex("by_profile", (query) => query.eq("profileId", viewer._id))
          .collect();

    const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
    const rows = await Promise.all(
      courseIds.map(async (courseId) => {
        const course = await ctx.db.get(courseId);
        if (!course) {
          return null;
        }

        const memberCount = (
          await ctx.db
            .query("courseEnrollments")
            .withIndex("by_course", (query) => query.eq("courseId", courseId))
            .collect()
        ).length;

        return {
          ...course,
          memberCount,
        };
      }),
    );

    return rows.filter((row) => row !== null).sort((a, b) => a.code.localeCompare(b.code));
  },
});

export const createCourse = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    school: v.optional(v.string()),
    semester: v.optional(v.string()),
    creditHours: v.optional(v.number()),
    description: v.optional(v.string()),
    lmsUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await ensureManagementAccess(ctx);
    const now = Date.now();

    const existing = await ctx.db
      .query("courses")
      .withIndex("by_code", (query) => query.eq("code", args.code.trim().toUpperCase()))
      .unique();
    if (existing) {
      throw new Error("A course with that code already exists.");
    }

    const courseId = await ctx.db.insert("courses", {
      code: args.code.trim().toUpperCase(),
      name: args.name.trim(),
      school: args.school,
      semester: args.semester,
      creditHours: args.creditHours,
      description: args.description,
      lecturerProfileId: actor.roles.includes("lecturer") ? actor._id : undefined,
      classRepProfileId: undefined,
      lmsUrl: args.lmsUrl,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(courseId);
  },
});

export const listAttendanceForViewer = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfileOrThrow(ctx);
    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_student", (query) => query.eq("studentProfileId", viewer._id))
      .collect();

    const rows = await Promise.all(
      records.map(async (record) => {
        const session = await ctx.db.get(record.attendanceSessionId);
        if (!session) {
          return null;
        }
        const course = await ctx.db.get(session.courseId);
        return {
          _id: record._id,
          status: record.status,
          recordedAt: record.recordedAt,
          note: record.note,
          sessionTitle: session.title,
          startsAt: session.startsAt,
          endsAt: session.endsAt,
          courseCode: course?.code ?? "N/A",
          location: session.location,
        };
      }),
    );

    return rows.filter((row) => row !== null).sort((a, b) => b.startsAt - a.startsAt);
  },
});
