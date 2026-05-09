import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type AuthDbCtx = Pick<QueryCtx, "auth" | "db"> | Pick<MutationCtx, "auth" | "db">;

export function inferRoleFromEmail(email: string): Doc<"profiles">["role"] {
  const lowered = email.toLowerCase();
  if (lowered.includes("research")) {
    return "researcher";
  }
  if (lowered.includes("department") || lowered.includes("admin")) {
    return "departmentAdmin";
  }
  if (lowered.includes("lecturer")) {
    return "lecturer";
  }
  if (lowered.includes("classrep") || lowered.includes("class.rep") || lowered.includes("rep")) {
    return "classRep";
  }
  return "student";
}

export async function getIdentityOrThrow(ctx: AuthDbCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("You must be signed in to access this resource.");
  }
  return identity;
}

export function getIdentityEmail(
  identity: Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>,
) {
  if (!identity) {
    return "unknown@nudge.local";
  }
  if (identity.email && identity.email.length > 0) {
    return identity.email;
  }
  if (identity.tokenIdentifier && identity.tokenIdentifier.length > 0) {
    const pieces = identity.tokenIdentifier.split("|");
    const candidate = pieces[pieces.length - 1];
    if (candidate) {
      return candidate;
    }
  }
  return `${identity.subject}@nudge.local`;
}

export function getIdentityName(
  identity: Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>,
) {
  if (!identity) {
    return "";
  }
  if (identity.name && identity.name.length > 0) {
    return identity.name;
  }
  return "";
}

export async function getViewerProfile(ctx: AuthDbCtx) {
  const identity = await getIdentityOrThrow(ctx);
  return ctx.db
    .query("profiles")
    .withIndex("by_authSubject", (query) => query.eq("authSubject", identity.subject))
    .unique();
}

export async function getViewerProfileOrThrow(ctx: AuthDbCtx) {
  const profile = await getViewerProfile(ctx);
  if (!profile) {
    throw new Error("Profile not initialized. Call profiles.ensureViewer first.");
  }
  return profile;
}

export function isPrivilegedRole(role: Doc<"profiles">["role"]) {
  return role !== "student";
}

export async function ensureManagementAccess(ctx: AuthDbCtx) {
  const profile = await getViewerProfileOrThrow(ctx);
  if (!isPrivilegedRole(profile.role)) {
    throw new Error("This action is restricted to academic managers and research leads.");
  }
  return profile;
}
