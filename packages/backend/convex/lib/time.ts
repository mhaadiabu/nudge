export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
export const DUE_SOON_WINDOW_HOURS = 72;

export function toHours(milliseconds: number) {
  return milliseconds / HOUR_MS;
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
