const GUEST_ID_KEY = "kara.guestId";
const NAME_KEY = "kara.displayName";
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
