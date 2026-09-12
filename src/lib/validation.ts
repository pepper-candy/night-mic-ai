import {
  MAX_ARTIST,
  MAX_NAME,
  MAX_TITLE,
  MAX_URL,
} from "@/lib/types";

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
