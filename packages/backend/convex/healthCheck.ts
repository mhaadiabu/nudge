import { query } from "./_generated/server";

export const get = query({
  handler: async (ctx) => {
    const [courses, assignments, announcements, resources] = await Promise.all([
      ctx.db.query("courses").collect(),
      ctx.db.query("assignments").collect(),
      ctx.db.query("announcements").collect(),
      ctx.db.query("resources").collect(),
    ]);

    return {
      status: "OK",
      counts: {
        courses: courses.length,
        assignments: assignments.length,
        announcements: announcements.length,
        resources: resources.length,
      },
    };
  },
});
