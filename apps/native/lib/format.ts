export function formatShortDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDayLabel(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatRole(role: string) {
  if (role === "classRep") return "Class Rep";
  if (role === "departmentAdmin") return "Department Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
