import type { Doc } from "../_generated/dataModel";
import { DUE_SOON_WINDOW_HOURS, HOUR_MS, toHours } from "./time";

type AssignmentStatus = Doc<"assignmentRecipients">["status"];
type NudgeUrgency = Doc<"nudgeEvents">["urgency"];

type ResolveAssignmentStatusInput = {
  dueAt: number;
  submittedAt?: number;
  now: number;
};

export function resolveAssignmentStatus({ dueAt, submittedAt, now }: ResolveAssignmentStatusInput) {
  if (submittedAt !== undefined) {
    return "submitted" satisfies AssignmentStatus;
  }
  if (dueAt <= now) {
    return "overdue" satisfies AssignmentStatus;
  }

  const hoursUntilDue = toHours(dueAt - now);
  if (hoursUntilDue <= DUE_SOON_WINDOW_HOURS) {
    return "dueSoon" satisfies AssignmentStatus;
  }

  return "upcoming" satisfies AssignmentStatus;
}

export function calculateLeadTimeHours(dueAt: number, submittedAt: number) {
  return toHours(dueAt - submittedAt);
}

export function isOnTimeSubmission(dueAt: number, submittedAt: number) {
  return submittedAt <= dueAt;
}

export function classifyNudgeUrgency(hoursUntilDue: number) {
  if (hoursUntilDue <= 8) {
    return "high" satisfies NudgeUrgency;
  }
  if (hoursUntilDue <= 36) {
    return "medium" satisfies NudgeUrgency;
  }
  return "low" satisfies NudgeUrgency;
}

export function computeHoursUntilDue(dueAt: number, now: number) {
  return (dueAt - now) / HOUR_MS;
}
