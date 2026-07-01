import { api } from "@nudge/backend/convex/_generated/api";
import { useQuery } from "convex/react";

import { DEFAULT_ROLE, resolveRoleConfig, type RoleConfig, type RoleId } from "@/lib/role-config";

type ViewerProfile = {
  _id: string;
  primaryRole: string;
  roles: string[];
  fullName?: string | null;
  email?: string | null;
  studentId?: string | null;
  programme?: string | null;
  level?: string | null;
};

export type ViewerSnapshot = {
  /** True until Convex has returned the viewer. */
  isLoading: boolean;
  /** Set when the viewer is null (signed out or still bootstrapping). */
  isMissing: boolean;
  /** Active role config (student by default until viewer loads). */
  config: RoleConfig;
  /** The role id from the profile (e.g. "student", "lecturer"). */
  roleId: RoleId | null;
  /** Raw viewer profile from Convex, if loaded. */
  profile: ViewerProfile | null;
  /** Convenience: true if the viewer is a manager. */
  isManager: boolean;
  /** Convenience: first name (or empty string while loading). */
  firstName: string;
};

export function useViewer(): ViewerSnapshot {
  const viewer = useQuery(api.profiles.getViewer);

  if (viewer === undefined) {
    return {
      isLoading: true,
      isMissing: false,
      config: DEFAULT_ROLE,
      roleId: null,
      profile: null,
      isManager: false,
      firstName: "",
    };
  }

  if (viewer === null) {
    return {
      isLoading: false,
      isMissing: true,
      config: DEFAULT_ROLE,
      roleId: null,
      profile: null,
      isManager: false,
      firstName: "",
    };
  }

  const profile = viewer as ViewerProfile;
  const config = resolveRoleConfig(profile.primaryRole);
  const firstName = profile.fullName?.split(" ")[0] ?? "";

  return {
    isLoading: false,
    isMissing: false,
    config,
    roleId: (profile.primaryRole as RoleId) ?? null,
    profile,
    isManager: config.isManager,
    firstName,
  };
}
