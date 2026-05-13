import type { MutationCtx } from "./_generated/server";
import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ensureManagementAccess } from "./lib/auth";
import { DAY_MS, HOUR_MS } from "./lib/time";

async function upsertProfileByEmail(
  ctx: MutationCtx,
  email: string,
  values: {
    fullName: string;
    role: "student" | "lecturer" | "classRep" | "departmentAdmin" | "researcher";
    studentId?: string;
    programme?: string;
    level?: string;
    consentStatus?: "pending" | "granted" | "declined";
  },
  now: number,
) {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_email", (query) => query.eq("email", email))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      fullName: values.fullName,
      roles: existing.roles.includes(values.role) ? existing.roles : [...existing.roles, values.role].slice(0, 2),
      primaryRole: values.role,
      studentId: values.studentId ?? existing.studentId,
      programme: values.programme ?? existing.programme,
      level: values.level ?? existing.level,
      updatedAt: now,
    });
    return existing._id;
  }

  const localPart = email.split("@")[0] ?? "";
  const cleanPart = localPart.replace(/[^a-z0-9]/gi, "");
  const isNumericStudent = /^\d{8}$/.test(cleanPart);
  const generatedStudentId =
    values.role === "student" && isNumericStudent
      ? `UPSA-${cleanPart}`
      : values.studentId;

  return ctx.db.insert("profiles", {
    authSubject: undefined,
    email,
    fullName: values.fullName,
    avatarUrl: undefined,
    roles: [values.role],
    primaryRole: values.role,
    studentId: generatedStudentId,
    programme: values.programme,
    level: values.level,
    consentStatus: values.consentStatus ?? "granted",
    consentedAt: values.role === "student" ? now - 10 * DAY_MS : undefined,
    onboardingCompletedAt: values.role === "student" ? now - 9 * DAY_MS : undefined,
    preferredReminderHour: values.role === "student" ? 18 : undefined,
    timezone: "Africa/Accra",
    lastActiveAt: now - DAY_MS,
    createdAt: now - 12 * DAY_MS,
    updatedAt: now,
  });
}

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const actor = await ensureManagementAccess(ctx);
    const now = Date.now();

    const currentStudentCount = await ctx.db
      .query("profiles")
      .collect();
      .collect();

    if (currentStudentCount.length > 0) {
      return { seeded: false, message: "Demo data already exists. Skipping reseed." };
    }

    const departmentAdminId = await upsertProfileByEmail(
      ctx,
      "department.admin@upsa.edu.gh",
      {
        fullName: "Akosua Department Admin",
        role: "departmentAdmin",
      },
      now,
    );
    const lecturerId = await upsertProfileByEmail(
      ctx,
      "lecturer.johnson@upsa.edu.gh",
      {
        fullName: "Dr. Kwame Johnson",
        role: "lecturer",
      },
      now,
    );
    const classRepId = await upsertProfileByEmail(
      ctx,
      "classrep.owusu@upsa.edu.gh",
      {
        fullName: "Nana Owusu",
        role: "classRep",
      },
      now,
    );
    const researcherId = await upsertProfileByEmail(
      ctx,
      "research.lead@upsa.edu.gh",
      {
        fullName: "Efua Research Lead",
        role: "researcher",
      },
      now,
    );

    const sourceConfigAssignmentId = await ctx.db.insert("sourceConfigs", {
      sourceType: "assignment",
      systemName: "UPSA LMS Pilot Feed",
      accessMethod: "import",
      minReliableFields: ["assignment title", "course code", "dueAt", "student mapping"],
      status: "confirmed",
      notes: "Pilot dataset synced twice daily for the academic dashboard MVP.",
      updatedByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    const sourceConfigSubmissionId = await ctx.db.insert("sourceConfigs", {
      sourceType: "submission",
      systemName: "UPSA Submission Ledger",
      accessMethod: "import",
      minReliableFields: ["assignment id", "student id", "status", "submittedAt"],
      status: "confirmed",
      notes: "Submission events exported from the institutional LMS for pilot reporting.",
      updatedByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("sourceConfigs", {
      sourceType: "timetable",
      systemName: "Department Timetable Board",
      accessMethod: "database",
      minReliableFields: ["course code", "start time", "end time", "venue"],
      status: "confirmed",
      notes: "Timetable changes are mirrored from departmental scheduling tools.",
      updatedByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    const cohortId = await ctx.db.insert("cohorts", {
      name: "Computer Science Year 3 - Pilot",
      description: "UPSA student pilot cohort for nudge evaluation.",
      year: "2026",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const students = [
      { name: "Ama Ofori", email: "ama.ofori@upsa.edu.gh", studentId: "UPSA-2026-001" },
      { name: "Kofi Mensah", email: "kofi.mensah@upsa.edu.gh", studentId: "UPSA-2026-002" },
      { name: "Efua Addo", email: "efua.addo@upsa.edu.gh", studentId: "UPSA-2026-003" },
      { name: "Yaw Boateng", email: "yaw.boateng@upsa.edu.gh", studentId: "UPSA-2026-004" },
      { name: "Abena Asare", email: "abena.asare@upsa.edu.gh", studentId: "UPSA-2026-005" },
      { name: "Kojo Danso", email: "kojo.danso@upsa.edu.gh", studentId: "UPSA-2026-006" },
    ];

    const studentProfileIds = await Promise.all(
      students.map(async (student) => {
        const profileId = await upsertProfileByEmail(
          ctx,
          student.email,
          {
            fullName: student.name,
            role: "student",
            studentId: student.studentId,
            programme: "BSc Information Technology",
            level: "Level 300",
            consentStatus: "granted",
          },
          now,
        );

        await ctx.db.insert("notificationSettings", {
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

        await ctx.db.insert("cohortMembers", {
          cohortId,
          studentProfileId: profileId,
          joinedAt: now - 9 * DAY_MS,
        });

        return profileId;
      }),
    );

    const courseData = [
      {
        code: "CS301",
        name: "Software Engineering",
        school: "Faculty of IT & Communication Studies",
        lecturerProfileId: lecturerId,
        classRepProfileId: classRepId,
        lmsUrl: "https://lms.upsa.edu.gh/courses/cs301",
      },
      {
        code: "IS305",
        name: "Information Systems Research",
        school: "Faculty of IT & Communication Studies",
        lecturerProfileId: researcherId,
        classRepProfileId: classRepId,
        lmsUrl: "https://lms.upsa.edu.gh/courses/is305",
      },
      {
        code: "CS330",
        name: "Mobile App Development",
        school: "Faculty of IT & Communication Studies",
        lecturerProfileId: lecturerId,
        classRepProfileId: classRepId,
        lmsUrl: "https://lms.upsa.edu.gh/courses/cs330",
      },
    ];

    const courseIds = new Map<string, Id<"courses">>();
    for (const course of courseData) {
      const id = await ctx.db.insert("courses", {
        code: course.code,
        name: course.name,
        school: course.school,
        semester: "Second Semester",
        creditHours: 3,
        description: `${course.name} centralizes lecture materials, announcements, and assessments in Nudge.`,
        lecturerProfileId: course.lecturerProfileId,
        classRepProfileId: course.classRepProfileId,
        lmsUrl: course.lmsUrl,
        createdAt: now,
        updatedAt: now,
      });
      courseIds.set(course.code, id);

      await ctx.db.insert("courseEnrollments", {
        courseId: id,
        profileId: course.lecturerProfileId,
        roleInCourse: "lecturer",
        enrolledAt: now - 14 * DAY_MS,
      });
      await ctx.db.insert("courseEnrollments", {
        courseId: id,
        profileId: classRepId,
        roleInCourse: "classRep",
        enrolledAt: now - 14 * DAY_MS,
      });
      for (const studentId of studentProfileIds) {
        await ctx.db.insert("courseEnrollments", {
          courseId: id,
          profileId: studentId,
          roleInCourse: "student",
          enrolledAt: now - 14 * DAY_MS,
        });
      }
    }

    const timetableSeed = [
      {
        courseCode: "CS301",
        title: "CS301 Sprint Planning Lecture",
        startsAt: now + 5 * HOUR_MS,
        endsAt: now + 7 * HOUR_MS,
        venue: "Lab 2",
        kind: "lecture" as const,
      },
      {
        courseCode: "IS305",
        title: "IS305 Research Methods Seminar",
        startsAt: now + 28 * HOUR_MS,
        endsAt: now + 30 * HOUR_MS,
        venue: "Block B Room 201",
        kind: "tutorial" as const,
      },
      {
        courseCode: "CS330",
        title: "CS330 Expo Build Practical",
        startsAt: now + 53 * HOUR_MS,
        endsAt: now + 56 * HOUR_MS,
        venue: "Innovation Hub",
        kind: "lab" as const,
      },
      {
        courseCode: "CS301",
        title: "CS301 Rescheduled Session",
        startsAt: now + 76 * HOUR_MS,
        endsAt: now + 78 * HOUR_MS,
        venue: "Lab 1",
        kind: "reschedule" as const,
      },
    ];

    for (const event of timetableSeed) {
      const courseId = courseIds.get(event.courseCode);
      if (!courseId) continue;
      await ctx.db.insert("timetableEvents", {
        courseId,
        title: event.title,
        description:
          event.kind === "reschedule" ? "Venue moved after faculty directive." : undefined,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venue: event.venue,
        kind: event.kind,
        isRescheduled: event.kind === "reschedule",
        originalStartsAt: event.kind === "reschedule" ? event.startsAt - 3 * HOUR_MS : undefined,
        audienceRoles: ["student", "lecturer", "classRep", "departmentAdmin", "researcher"],
        cohortLabel: "CS Year 3 Pilot",
        createdByProfileId: departmentAdminId,
        createdAt: now,
        updatedAt: now,
      });
    }

    const resourceSeed = [
      {
        courseCode: "CS301",
        title: "Sprint backlog template",
        description: "Reusable backlog template for assignment planning.",
        kind: "template" as const,
        url: "https://example.com/resources/sprint-backlog-template",
        isPinned: true,
      },
      {
        courseCode: "CS330",
        title: "Expo + Convex integration guide",
        description: "Step-by-step setup notes for mobile delivery.",
        kind: "reading" as const,
        url: "https://example.com/resources/expo-convex-guide",
        isPinned: true,
      },
      {
        courseCode: "IS305",
        title: "Pilot evaluation rubric",
        description: "Rubric for the usability evaluation report.",
        kind: "lecture-note" as const,
        url: "https://example.com/resources/evaluation-rubric",
        isPinned: false,
      },
    ];

    for (const resource of resourceSeed) {
      const courseId = courseIds.get(resource.courseCode);
      if (!courseId) continue;
      await ctx.db.insert("resources", {
        courseId,
        title: resource.title,
        description: resource.description,
        kind: resource.kind,
        url: resource.url,
        isPinned: resource.isPinned,
        audienceRoles: ["student", "lecturer", "classRep", "departmentAdmin", "researcher"],
        uploadedByProfileId: lecturerId,
        createdAt: now - DAY_MS,
        updatedAt: now,
      });
    }

    await ctx.db.insert("announcements", {
      courseId: courseIds.get("CS301"),
      title: "Software Engineering class moved to Lab 2",
      body: "Thursday's sprint planning lecture now starts in Lab 2 at 9:00 AM. Bring your project boards.",
      category: "reschedule",
      publishedAt: now - 2 * HOUR_MS,
      pinUntil: now + 2 * DAY_MS,
      audienceRoles: ["student", "lecturer", "classRep", "departmentAdmin", "researcher"],
      postedByProfileId: classRepId,
      linkUrl: undefined,
      createdAt: now - 2 * HOUR_MS,
      updatedAt: now,
    });
    await ctx.db.insert("announcements", {
      courseId: undefined,
      title: "Wellness week support desk",
      body: "The academic support desk will run focused study clinics this week. Students behind on deadlines are encouraged to book a slot.",
      category: "wellness",
      publishedAt: now - 5 * HOUR_MS,
      pinUntil: now + 5 * DAY_MS,
      audienceRoles: ["student", "lecturer", "classRep", "departmentAdmin", "researcher"],
      postedByProfileId: departmentAdminId,
      linkUrl: "https://example.com/wellness-support",
      createdAt: now - 5 * HOUR_MS,
      updatedAt: now,
    });

    const assignments = [
      {
        title: "Prototype Evaluation Report",
        description: "Submit your usability evaluation report for the Nudge pilot.",
        courseCode: "IS305",
        dueAt: now + 14 * HOUR_MS,
      },
      {
        title: "REST API Integration Lab",
        description: "Complete and submit the integration exercises.",
        courseCode: "CS301",
        dueAt: now + 52 * HOUR_MS,
      },
      {
        title: "Sprint Reflection Video",
        description: "Upload a short reflection video covering your mobile build sprint.",
        courseCode: "CS330",
        dueAt: now + 100 * HOUR_MS,
      },
      {
        title: "Testing Strategy Documentation",
        description: "Document your unit and integration testing strategy.",
        courseCode: "CS301",
        dueAt: now - 20 * HOUR_MS,
      },
    ];

    const assignmentRows: Array<{ id: Id<"assignments">; dueAt: number; courseCode: string }> = [];
    for (let index = 0; index < assignments.length; index += 1) {
      const assignment = assignments[index];
      const courseId = courseIds.get(assignment.courseCode);
      if (!courseId) continue;
      const assignmentId = await ctx.db.insert("assignments", {
        sourceSystem: "UPSA LMS Pilot Feed",
        sourceId: `seed-assignment-${index + 1}`,
        title: assignment.title,
        description: assignment.description,
        courseId,
        courseCode: assignment.courseCode,
        dueAt: assignment.dueAt,
        publishedAt: now - 5 * DAY_MS,
        weight: 10 + index * 5,
        linkUrl: `https://lms.upsa.edu.gh/assignments/${index + 1}`,
        submissionMode: "digital",
        createdAt: now - 5 * DAY_MS,
        updatedAt: now,
      });
      assignmentRows.push({
        id: assignmentId,
        dueAt: assignment.dueAt,
        courseCode: assignment.courseCode,
      });
    }

    for (let studentIndex = 0; studentIndex < studentProfileIds.length; studentIndex += 1) {
      const studentId = studentProfileIds[studentIndex];
      for (let assignmentIndex = 0; assignmentIndex < assignmentRows.length; assignmentIndex += 1) {
        const assignment = assignmentRows[assignmentIndex];
        const dueAt = assignment.dueAt;
        const patternSeed = studentIndex + assignmentIndex;
        const isSubmitted = patternSeed % 4 !== 0;
        const submittedOffsetHours = 4 + ((studentIndex * 3 + assignmentIndex * 5) % 28);
        const submittedAt = isSubmitted ? dueAt - submittedOffsetHours * HOUR_MS : undefined;

        const status = submittedAt
          ? "submitted"
          : dueAt < now
            ? "overdue"
            : dueAt - now <= 72 * HOUR_MS
              ? "dueSoon"
              : "upcoming";

        await ctx.db.insert("assignmentRecipients", {
          assignmentId: assignment.id,
          studentProfileId: studentId,
          sourceStudentRef: students[studentIndex]?.studentId,
          assignmentDueAt: dueAt,
          assignedAt: now - 4 * DAY_MS,
          status,
          lastViewedAt: now - ((studentIndex + assignmentIndex) % 48) * HOUR_MS,
          createdAt: now - 4 * DAY_MS,
          updatedAt: now,
        });

        if (submittedAt || dueAt < now) {
          await ctx.db.insert("submissions", {
            assignmentId: assignment.id,
            studentProfileId: studentId,
            status: submittedAt ? "submitted" : "missed",
            submittedAt,
            isOnTime: submittedAt ? submittedAt <= dueAt : false,
            leadTimeHours: submittedAt ? (dueAt - submittedAt) / HOUR_MS : undefined,
            sourceSystem: "UPSA Submission Ledger",
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    const attendanceSessionIds: Id<"attendanceSessions">[] = [];
    for (const [index, courseCode] of ["CS301", "IS305", "CS330"].entries()) {
      const courseId = courseIds.get(courseCode);
      if (!courseId) continue;
      const attendanceSessionId = await ctx.db.insert("attendanceSessions", {
        courseId,
        title: `${courseCode} weekly attendance`,
        startsAt: now - (index + 1) * 3 * DAY_MS,
        endsAt: now - (index + 1) * 3 * DAY_MS + 2 * HOUR_MS,
        location: "Faculty Lecture Hall",
        createdByProfileId: lecturerId,
        createdAt: now - (index + 1) * 3 * DAY_MS,
      });
      attendanceSessionIds.push(attendanceSessionId);

      for (let studentIndex = 0; studentIndex < studentProfileIds.length; studentIndex += 1) {
        const status =
          studentIndex % 5 === 0 ? "late" : studentIndex % 4 === 0 ? "absent" : "present";
        await ctx.db.insert("attendanceRecords", {
          attendanceSessionId,
          studentProfileId: studentProfileIds[studentIndex],
          status,
          recordedAt: now - (index + 1) * 3 * DAY_MS + HOUR_MS,
          note: status === "absent" ? "Missed after commuting delay." : undefined,
        });
      }
    }

    const strategyIds = {
      deadline: await ctx.db.insert("nudgeStrategies", {
        name: "Baseline Deadline Reminder",
        description: "Default schedule at 48h and 24h before deadline.",
        type: "deadline-reminder",
        config: { offsetsHours: [48, 24] },
        isActive: true,
        createdByProfileId: actor._id,
        createdAt: now,
        updatedAt: now,
      }),
      adaptive: await ctx.db.insert("nudgeStrategies", {
        name: "Adaptive Behavior Strategy v1",
        description: "Rule-based personalized timing and urgency.",
        type: "personalized-timing",
        config: { fallbackOffsets: [72, 36, 12] },
        isActive: true,
        createdByProfileId: actor._id,
        createdAt: now,
        updatedAt: now,
      }),
      motivational: await ctx.db.insert("nudgeStrategies", {
        name: "Motivational Momentum",
        description: "Encouragement nudges for low engagement cohorts.",
        type: "motivational",
        config: { offsetsHours: [48, 18] },
        isActive: true,
        createdByProfileId: actor._id,
        createdAt: now,
        updatedAt: now,
      }),
      social: await ctx.db.insert("nudgeStrategies", {
        name: "Social Norm Pilot Cue",
        description: "Peer-progress framing for the pilot treatment group.",
        type: "social-norm",
        config: { offsetsHours: [48, 18] },
        isActive: true,
        createdByProfileId: actor._id,
        createdAt: now,
        updatedAt: now,
      }),
    };

    await ctx.db.insert("nudgeTemplates", {
      strategyId: strategyIds.deadline,
      title: "Upcoming deadline",
      body: "{{assignment}} is due {{dueAt}}. Plan a focused work block today.",
      channel: "in-app",
      tone: "neutral",
      minHoursBeforeDue: 24,
      maxHoursBeforeDue: 72,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("nudgeTemplates", {
      strategyId: strategyIds.adaptive,
      title: "Start early to stay ahead",
      body: "Based on your recent pattern, an earlier start on {{assignment}} gives better outcomes.",
      channel: "push",
      tone: "neutral",
      minHoursBeforeDue: 8,
      maxHoursBeforeDue: 96,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("nudgeTemplates", {
      strategyId: strategyIds.social,
      title: "Your classmates are already moving",
      body: "Students in your cohort are already progressing on {{assignment}} before {{dueAt}}.",
      channel: "in-app",
      tone: "motivational",
      minHoursBeforeDue: 8,
      maxHoursBeforeDue: 72,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const experimentId = await ctx.db.insert("experiments", {
      name: "Adaptive vs Social Reminder Trial",
      hypothesis: "Adaptive timing and social-norm cues improve on-time submission and lead time.",
      status: "running",
      cohortId,
      startAt: now - 2 * DAY_MS,
      endAt: now + 20 * DAY_MS,
      createdByProfileId: actor._id,
      createdAt: now,
      updatedAt: now,
    });

    const controlGroupId = await ctx.db.insert("experimentGroups", {
      experimentId,
      name: "Control - Baseline",
      strategyId: strategyIds.deadline,
      allocationPercentage: 34,
      createdAt: now,
    });
    const adaptiveGroupId = await ctx.db.insert("experimentGroups", {
      experimentId,
      name: "Treatment - Adaptive",
      strategyId: strategyIds.adaptive,
      allocationPercentage: 33,
      createdAt: now,
    });
    const socialGroupId = await ctx.db.insert("experimentGroups", {
      experimentId,
      name: "Treatment - Social Norm",
      strategyId: strategyIds.social,
      allocationPercentage: 33,
      createdAt: now,
    });

    const groups = [controlGroupId, adaptiveGroupId, socialGroupId];
    for (let index = 0; index < studentProfileIds.length; index += 1) {
      const profileId = studentProfileIds[index];
      const groupId = groups[index % groups.length];
      await ctx.db.insert("experimentAssignments", {
        experimentId,
        groupId,
        studentProfileId: profileId,
        assignedAt: now - DAY_MS,
        assignmentMethod: "random",
      });
    }

    for (let index = 0; index < studentProfileIds.length; index += 1) {
      const profileId = studentProfileIds[index];
      const assignment = assignmentRows[index % assignmentRows.length];
      const groupId = groups[index % groups.length];
      const strategyId =
        groupId === controlGroupId
          ? strategyIds.deadline
          : groupId === adaptiveGroupId
            ? strategyIds.adaptive
            : strategyIds.social;
      if (!assignment) continue;

      await ctx.db.insert("nudgeEvents", {
        studentProfileId: profileId,
        assignmentId: assignment.id,
        strategyId,
        templateId: undefined,
        experimentId,
        groupId,
        type:
          strategyId === strategyIds.social
            ? "social-norm"
            : strategyId === strategyIds.adaptive
              ? "personalized-timing"
              : "deadline-reminder",
        channel: strategyId === strategyIds.adaptive ? "push" : "in-app",
        title: strategyId === strategyIds.social ? "Your cohort is moving" : "Upcoming deadline",
        message:
          strategyId === strategyIds.social
            ? "Most students in your cohort plan to submit early this week."
            : "Your next assignment is approaching. Block time now and stay on track.",
        urgency: assignment.dueAt - now <= 24 * HOUR_MS ? "medium" : "low",
        scheduledFor: now - (index + 1) * HOUR_MS,
        sentAt: now - (index + 1) * HOUR_MS,
        openedAt: index % 2 === 0 ? now - index * 30 * 60 * 1000 : undefined,
        deliveryStatus: index % 2 === 0 ? "opened" : "sent",
        adaptationReason: "Seeded for pilot demonstration.",
        metadata: { seeded: true },
        createdAt: now,
        updatedAt: now,
      });
    }

    const surveyTemplateId = await ctx.db.insert("surveyTemplates", {
      title: "Weekly student pulse",
      description: "Measures clarity, workload confidence, and perceived nudge usefulness.",
      audienceRoles: ["student"],
      status: "live",
      questions: [
        {
          id: "clarity",
          prompt: "How clear are your priorities this week?",
          scaleMin: 1,
          scaleMax: 5,
        },
        {
          id: "confidence",
          prompt: "How confident are you about meeting deadlines?",
          scaleMin: 1,
          scaleMax: 5,
        },
        {
          id: "usefulness",
          prompt: "How useful are the reminders you receive?",
          scaleMin: 1,
          scaleMax: 5,
        },
      ],
      createdByProfileId: researcherId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("surveyResponses", {
      surveyTemplateId,
      respondentProfileId: studentProfileIds[0],
      submittedAt: now - HOUR_MS,
      answers: [
        { questionId: "clarity", value: "4" },
        { questionId: "confidence", value: "4" },
        { questionId: "usefulness", value: "5" },
      ],
    });

    await ctx.db.insert("ingestionRuns", {
      sourceSystem: "UPSA LMS Pilot Feed",
      status: "succeeded",
      startedAt: now - HOUR_MS,
      endedAt: now - HOUR_MS + 4 * 60 * 1000,
      recordsIngested: assignmentRows.length + studentProfileIds.length,
      errorMessage: undefined,
    });
    await ctx.db.insert("ingestionRuns", {
      sourceSystem: "UPSA Submission Ledger",
      status: "succeeded",
      startedAt: now - HOUR_MS,
      endedAt: now - HOUR_MS + 3 * 60 * 1000,
      recordsIngested: studentProfileIds.length * 2,
      errorMessage: undefined,
    });

    await ctx.db.insert("activityEvents", {
      studentProfileId: actor._id,
      assignmentId: assignmentRows[0]?.id,
      eventType: "data_ingested",
      eventAt: now,
      payload: {
        assignmentSourceConfigId: sourceConfigAssignmentId,
        submissionSourceConfigId: sourceConfigSubmissionId,
      },
      experimentId,
      groupId: controlGroupId,
    });

    return {
      seeded: true,
      counts: {
        students: studentProfileIds.length,
        courses: courseIds.size,
        assignments: assignmentRows.length,
        attendanceSessions: attendanceSessionIds.length,
      },
    };
  },
});
