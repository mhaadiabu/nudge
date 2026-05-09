import type { Doc } from "../_generated/dataModel";

type SubmissionDoc = Doc<"submissions">;

export type SubmissionMetrics = {
  total: number;
  submittedCount: number;
  onTimeCount: number;
  missedCount: number;
  overdueCount: number;
  avgLeadHours: number;
  onTimeRate: number;
  missedRate: number;
};

export function createEmptySubmissionMetrics(): SubmissionMetrics {
  return {
    total: 0,
    submittedCount: 0,
    onTimeCount: 0,
    missedCount: 0,
    overdueCount: 0,
    avgLeadHours: 0,
    onTimeRate: 0,
    missedRate: 0,
  };
}

export function computeSubmissionMetrics(submissions: SubmissionDoc[]): SubmissionMetrics {
  if (submissions.length === 0) {
    return createEmptySubmissionMetrics();
  }

  let submittedCount = 0;
  let onTimeCount = 0;
  let missedCount = 0;
  let leadSum = 0;
  let leadCount = 0;

  for (const submission of submissions) {
    if (submission.status === "missed") {
      missedCount += 1;
      continue;
    }

    submittedCount += 1;
    if (submission.isOnTime) {
      onTimeCount += 1;
    }

    if (typeof submission.leadTimeHours === "number") {
      leadSum += submission.leadTimeHours;
      leadCount += 1;
    }
  }

  const total = submissions.length;

  return {
    total,
    submittedCount,
    onTimeCount,
    missedCount,
    overdueCount: missedCount,
    avgLeadHours: leadCount === 0 ? 0 : leadSum / leadCount,
    onTimeRate: total === 0 ? 0 : onTimeCount / total,
    missedRate: total === 0 ? 0 : missedCount / total,
  };
}
