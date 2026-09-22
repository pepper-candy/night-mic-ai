import {
  MAX_ARTIST,
  MAX_EVENT_DESCRIPTION,
  MAX_EVENT_LOCATION,
  MAX_EVENT_TITLE,
  MAX_LANGUAGE_OTHER,
  MAX_NAME,
  MAX_TITLE,
  MAX_URL,
  type EventInfo,
  type SongLanguage,
} from "@/lib/types";
import {
  DEFAULT_EVENT_TIMEZONE,
  isEventTimezone,
  zonedLocalToUtcMs,
} from "@/lib/event-time";

export function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateName(value: unknown): string {
  const name = trim(value);
  if (name.length < 1) throw new Error("Pick a display name so the room knows who queued it.");
  if (name.length > MAX_NAME) throw new Error(`Keep names under ${MAX_NAME} characters.`);
  return name;
}

export function validateTitle(value: unknown): string {
  const title = trim(value);
  if (title.length < 1) throw new Error("A song needs a title.");
  if (title.length > MAX_TITLE) throw new Error(`Titles max out at ${MAX_TITLE} characters.`);
  return title;
}

export function validateArtist(value: unknown): string {
  const artist = trim(value);
  if (artist.length < 1) throw new Error("Who sings it? Artist is required.");
  if (artist.length > MAX_ARTIST) throw new Error(`Artist names max out at ${MAX_ARTIST} characters.`);
  return artist;
}

export function validateUrl(value: unknown): string | undefined {
  const url = trim(value);
  if (!url) return undefined;
  if (url.length > MAX_URL) throw new Error("That link is too long.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Use a full http(s) link, or leave the URL blank.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http or https links are allowed.");
  }
  return parsed.toString();
}

export function validateGuestId(value: unknown): string {
  const id = trim(value);
  if (id.length < 8 || id.length > 80) throw new Error("Guest session looks invalid. Refresh and try again.");
  return id;
}

export function validateLanguage(
  language: unknown,
  languageOther: unknown,
): { language: SongLanguage; languageOther?: string } {
  const lang = trim(language).toLowerCase();
  if (lang === "cantonese" || lang === "english") {
    return { language: lang };
  }
  if (lang === "other") {
    const other = trim(languageOther);
    if (other.length < 1) throw new Error("Say which language — e.g. Mandarin, Japanese, Korean.");
    if (other.length > MAX_LANGUAGE_OTHER) {
      throw new Error(`Keep the language note under ${MAX_LANGUAGE_OTHER} characters.`);
    }
    return { language: "other", languageOther: other };
  }
  throw new Error("Pick Cantonese, English, or Other languages.");
}

export function validateEventInput(input: {
  title: unknown;
  description: unknown;
  location: unknown;
  startsAt: unknown;
  timezone?: unknown;
}): EventInfo {
  const title = trim(input.title);
  const description = trim(input.description);
  const location = trim(input.location);

  if (title.length < 1) throw new Error("Give the event a title.");
  if (title.length > MAX_EVENT_TITLE) {
    throw new Error(`Event titles max out at ${MAX_EVENT_TITLE} characters.`);
  }
  if (description.length > MAX_EVENT_DESCRIPTION) {
    throw new Error(`Keep the description under ${MAX_EVENT_DESCRIPTION} characters.`);
  }
  if (location.length > MAX_EVENT_LOCATION) {
    throw new Error(`Keep the location under ${MAX_EVENT_LOCATION} characters.`);
  }

  const timezoneRaw = trim(input.timezone);
  const timezone = timezoneRaw
    ? timezoneRaw
    : DEFAULT_EVENT_TIMEZONE;
  if (!isEventTimezone(timezone)) {
    throw new Error("Pick a timezone from the list. Default is Hong Kong (HKT).");
  }

  let startsAt: number;
  if (typeof input.startsAt === "number") {
    startsAt = input.startsAt;
  } else if (typeof input.startsAt === "string" && input.startsAt.trim()) {
    const raw = input.startsAt.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)) {
      startsAt = zonedLocalToUtcMs(raw, timezone);
    } else {
      startsAt = Date.parse(raw);
    }
  } else {
    throw new Error("Set a start date and time for the event.");
  }

  if (!Number.isFinite(startsAt)) {
    throw new Error("That start time does not look valid.");
  }

  return {
    title,
    description,
    location,
    startsAt,
    timezone,
  };
}
