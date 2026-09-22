export const DEFAULT_EVENT_TIMEZONE = "Asia/Hong_Kong";

export const EVENT_TIMEZONES = [
  { id: "Asia/Hong_Kong", label: "Hong Kong (HKT, UTC+8)" },
  { id: "Asia/Shanghai", label: "Mainland China (CST, UTC+8)" },
  { id: "Asia/Taipei", label: "Taipei (CST, UTC+8)" },
  { id: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
  { id: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)" },
  { id: "Asia/Seoul", label: "Seoul (KST, UTC+9)" },
  { id: "UTC", label: "UTC" },
  { id: "Europe/London", label: "London" },
  { id: "America/New_York", label: "New York" },
  { id: "America/Los_Angeles", label: "Los Angeles" },
] as const;

export type EventTimezoneId = (typeof EVENT_TIMEZONES)[number]["id"];

export function isEventTimezone(value: string): value is EventTimezoneId {
  return EVENT_TIMEZONES.some((zone) => zone.id === value);
}

export function resolveEventTimezone(value?: string | null): string {
  if (value && isEventTimezone(value)) return value;
  return DEFAULT_EVENT_TIMEZONE;
}

export function eventTimezoneLabel(id?: string | null): string {
  const resolved = resolveEventTimezone(id);
  return EVENT_TIMEZONES.find((zone) => zone.id === resolved)?.label ?? resolved;
}

function zoneParts(ms: number, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const bag: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of dtf.formatToParts(new Date(ms))) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

/** Readable wall-clock label for a `datetime-local` value (no timezone shift). */
export function formatDatetimeLocalValue(local: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local.trim());
  if (!match) return "";
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Wall-clock value for <input type="datetime-local" /> in the event timezone. */
export function toDatetimeLocalInZone(ms: number, timeZone: string): string {
  const p = zoneParts(ms, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Interpret YYYY-MM-DDTHH:mm as wall time in `timeZone` and return UTC ms.
 * Does not use the viewer's browser timezone.
 */
export function zonedLocalToUtcMs(local: string, timeZone: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local.trim());
  if (!match) return Number.NaN;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = desired;
  for (let i = 0; i < 3; i++) {
    const p = zoneParts(utc, timeZone);
    const displayed = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    utc += desired - displayed;
  }
  return utc;
}

export function formatEventWhen(ms: number, timeZone?: string | null): string {
  const zone = resolveEventTimezone(timeZone);
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString();
  }
}
