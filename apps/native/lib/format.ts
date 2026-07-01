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

export function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) {
    return "Unknown size";
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = value < 10 && unitIndex > 0 ? value.toFixed(1) : Math.round(value);
  return `${rounded} ${units[unitIndex]}`;
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
