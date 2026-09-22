import { normalizeCode } from "@/lib/codes";

const GUEST_ID_KEY = "kara.guestId";
const NAME_KEY = "kara.displayName";
const ROOM_NICKNAMES_KEY = "kara.roomNicknames";
const HOST_TOKENS_KEY = "kara.hostTokens";
const COHOST_TOKENS_KEY = "kara.cohostTokens";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setDisplayName(name: string) {
  window.localStorage.setItem(NAME_KEY, name.trim());
}

/** Nickname locked to this device for one room/event. Empty if they have not joined yet. */
export function getRoomNickname(code: string): string {
  const key = normalizeCode(code);
  if (!key) return "";
  const names = readJson<Record<string, string>>(ROOM_NICKNAMES_KEY, {});
  return names[key]?.trim() ?? "";
}

/**
 * Bind a nickname to this device + room. If one already exists, it is kept
 * (incognito / another browser can still pick a new name — we only lock this device).
 */
export function bindRoomNickname(code: string, name: string): string {
  if (typeof window === "undefined") return name.trim();
  const key = normalizeCode(code);
  if (!key) return "";
  const names = readJson<Record<string, string>>(ROOM_NICKNAMES_KEY, {});
  const existing = names[key]?.trim();
  if (existing) return existing;
  const next = name.trim();
  if (!next) return "";
  names[key] = next;
  window.localStorage.setItem(ROOM_NICKNAMES_KEY, JSON.stringify(names));
  return next;
}

export function getHostToken(code: string): string | undefined {
  const tokens = readJson<Record<string, string>>(HOST_TOKENS_KEY, {});
  return tokens[code];
}

export function setHostToken(code: string, token: string) {
  const tokens = readJson<Record<string, string>>(HOST_TOKENS_KEY, {});
  tokens[code] = token;
  window.localStorage.setItem(HOST_TOKENS_KEY, JSON.stringify(tokens));
}

export function getCohostToken(code: string): string | undefined {
  const tokens = readJson<Record<string, string>>(COHOST_TOKENS_KEY, {});
  return tokens[code];
}

export function setCohostToken(code: string, token: string) {
  const tokens = readJson<Record<string, string>>(COHOST_TOKENS_KEY, {});
  tokens[code] = token;
  window.localStorage.setItem(COHOST_TOKENS_KEY, JSON.stringify(tokens));
}

export function rememberHostSession(code: string, token: string) {
  setHostToken(code, token);
}

/** Prefer host token when both exist on this device. */
export function getStaffToken(code: string): string | undefined {
  return getHostToken(code) || getCohostToken(code);
}
