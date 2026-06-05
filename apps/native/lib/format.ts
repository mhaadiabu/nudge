export function formatShortDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: number) {
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

export function formatRole(role: string | readonly string[]) {
  const roles = Array.isArray(role) ? role : [role];
  return roles
    .map((r) => {
      if (r === "classRep") return "Class Rep";
      if (r === "departmentAdmin") return "Department Admin";
      return r.charAt(0).toUpperCase() + r.slice(1);
    })
    .join(", ");
}
