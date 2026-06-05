import {
  BellIcon,
  Calendar01Icon,
  ChartLineData01Icon,
  CheckListIcon,
  Home01Icon,
  Menu01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react-native";
import type { Href } from "expo-router";

export type RoleId = "student" | "lecturer" | "classRep" | "departmentAdmin" | "researcher";

export type TabDefinition = {
  name: string;
  href: Href;
  label: string;
  icon: IconSvgElement;
};

export type AccentPalette = {
  /** Base brand colour for the role. */
  accent: string;
  /** Soft surface tint (low alpha). */
  accentSoft: string;
  /** Slightly stronger soft tint (cards, pills). */
  accentSoftStrong: string;
  /** Foreground colour when sitting on top of an `accent*` surface. */
  accentForeground: string;
  /** Deep variant used in gradients. */
  accentDeep: string;
  /** Glow variant used in highlights. */
  accentGlow: string;
};

export type RoleConfig = {
  id: RoleId;
  /** Short display label, e.g. "Lecturer". */
  label: string;
  /** Singular noun used in copy, e.g. "lecturer" vs "student". */
  noun: string;
  /** Plural noun used in copy. */
  plural: string;
  /** True if the role can manage content / run the pilot. */
  isManager: boolean;
  /** Hero copy shown on the home screen. */
  hero: {
    eyebrow: string;
    title: (firstName: string) => string;
    subtitle: string;
    decoration: IconSvgElement;
  };
  /** Tab set rendered in the floating tab bar. */
  tabs: TabDefinition[];
  /** Brand palette used to tint the chrome. */
  palette: AccentPalette;
};

const basePalette: AccentPalette = {
  accent: "#E5463A",
  accentSoft: "rgba(229, 70, 58, 0.12)",
  accentSoftStrong: "rgba(229, 70, 58, 0.22)",
  accentForeground: "#E5463A",
  accentDeep: "#8E2A23",
  accentGlow: "#F0A39A",
};

const indigo: AccentPalette = {
  accent: "#5B5BD6",
  accentSoft: "rgba(91, 91, 214, 0.12)",
  accentSoftStrong: "rgba(91, 91, 214, 0.22)",
  accentForeground: "#4A4ABF",
  accentDeep: "#2E2E8C",
  accentGlow: "#A5A5F0",
};

const teal: AccentPalette = {
  accent: "#0E8C8C",
  accentSoft: "rgba(14, 140, 140, 0.12)",
  accentSoftStrong: "rgba(14, 140, 140, 0.22)",
  accentForeground: "#0B7373",
  accentDeep: "#0A5A5A",
  accentGlow: "#7CCCCC",
};

const amber: AccentPalette = {
  accent: "#C2691F",
  accentSoft: "rgba(194, 105, 31, 0.14)",
  accentSoftStrong: "rgba(194, 105, 31, 0.24)",
  accentForeground: "#A4571A",
  accentDeep: "#7A3F11",
  accentGlow: "#E8B98A",
};

const plum: AccentPalette = {
  accent: "#8E3D8C",
  accentSoft: "rgba(142, 61, 140, 0.12)",
  accentSoftStrong: "rgba(142, 61, 140, 0.22)",
  accentForeground: "#7A3278",
  accentDeep: "#5C235A",
  accentGlow: "#D4A5D2",
};

const studentTabs: TabDefinition[] = [
  { name: "home", href: "/home", label: "Home", icon: Home01Icon },
  { name: "planner", href: "/planner", label: "Planner", icon: CheckListIcon },
  { name: "calendar", href: "/calendar", label: "Calendar", icon: Calendar01Icon },
  { name: "nudges", href: "/nudges", label: "Nudges", icon: BellIcon },
  { name: "more", href: "/more", label: "More", icon: Menu01Icon },
];

const managerTabs: TabDefinition[] = [
  { name: "home", href: "/home", label: "Home", icon: Home01Icon },
  { name: "team", href: "/team", label: "Team", icon: UserMultipleIcon },
  { name: "calendar", href: "/calendar", label: "Calendar", icon: Calendar01Icon },
  { name: "insights", href: "/insights", label: "Insights", icon: ChartLineData01Icon },
  { name: "more", href: "/more", label: "More", icon: Menu01Icon },
];

export const ROLE_CONFIGS: Record<RoleId, RoleConfig> = {
  student: {
    id: "student",
    label: "Student",
    noun: "student",
    plural: "students",
    isManager: false,
    hero: {
      eyebrow: "Pilot workspace",
      title: (firstName) => `Hi, ${firstName}`,
      subtitle: "Your assignments, classes, and nudges at a glance.",
      decoration: BellIcon,
    },
    tabs: studentTabs,
    palette: basePalette,
  },
  classRep: {
    id: "classRep",
    label: "Class Rep",
    noun: "class rep",
    plural: "class reps",
    isManager: true,
    hero: {
      eyebrow: "Class rep workspace",
      title: (firstName) => `Welcome, ${firstName}`,
      subtitle: "Stay close to your cohort's assignments and announcements.",
      decoration: CheckListIcon,
    },
    tabs: managerTabs,
    palette: amber,
  },
  lecturer: {
    id: "lecturer",
    label: "Lecturer",
    noun: "lecturer",
    plural: "lecturers",
    isManager: true,
    hero: {
      eyebrow: "Lecturer workspace",
      title: (firstName) => `Hello, ${firstName}`,
      subtitle: "Track your students' progress, deadlines, and engagement.",
      decoration: ChartLineData01Icon,
    },
    tabs: managerTabs,
    palette: indigo,
  },
  departmentAdmin: {
    id: "departmentAdmin",
    label: "Department Admin",
    noun: "admin",
    plural: "admins",
    isManager: true,
    hero: {
      eyebrow: "Department workspace",
      title: (firstName) => `Welcome back, ${firstName}`,
      subtitle: "Run the pilot: publish content, monitor engagement, and seed data.",
      decoration: ChartLineData01Icon,
    },
    tabs: managerTabs,
    palette: teal,
  },
  researcher: {
    id: "researcher",
    label: "Researcher",
    noun: "researcher",
    plural: "researchers",
    isManager: true,
    hero: {
      eyebrow: "Research workspace",
      title: (firstName) => `Hello, ${firstName}`,
      subtitle: "Pull behaviour signals, engagement metrics, and survey data.",
      decoration: ChartLineData01Icon,
    },
    tabs: managerTabs,
    palette: plum,
  },
};

export const DEFAULT_ROLE: RoleConfig = ROLE_CONFIGS.student;

export function isPrivilegedRoleId(role: string | null | undefined): boolean {
  if (!role) {
    return false;
  }
  return role !== "student";
}

export function resolveRoleConfig(roleId: string | null | undefined): RoleConfig {
  if (!roleId) {
    return DEFAULT_ROLE;
  }
  return ROLE_CONFIGS[roleId as RoleId] ?? DEFAULT_ROLE;
}
