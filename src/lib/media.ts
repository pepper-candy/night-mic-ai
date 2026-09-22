export function youtubeVideoId(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

export function spotifyEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "open.spotify.com" && host !== "spotify.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    // track / album / playlist / episode
    if (parts.length < 2) return null;
    const [type, id] = parts;
    if (!type || !id) return null;
    if (!["track", "album", "playlist", "episode"].includes(type)) return null;
    return `https://open.spotify.com/embed/${type}/${id}`;
  } catch {
    return null;
  }
}

export function languageLabel(language: string, languageOther?: string): string {
  if (language === "cantonese") return "Cantonese";
  if (language === "english") return "English";
  if (language === "other") return languageOther?.trim() || "Other";
  return language;
}

/** Google lyrics search — Cantonese uses 歌詞, everything else uses Lyrics. */
export function lyricsSearchQuery(title: string, language?: string): string {
  const name = title.trim();
  if ((language || "english") === "cantonese") {
    return `${name} 歌詞`;
  }
  return `${name} Lyrics`;
}

export function lyricsSearchUrl(title: string, language?: string): string {
  const q = lyricsSearchQuery(title, language);
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function lyricsSearchButtonLabel(title: string, language?: string): string {
  return `🔍${lyricsSearchQuery(title, language)}`;
}

/** Format a Date for <input type="datetime-local" /> in local timezone. */
export function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatEventWhen(ms: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString();
  }
}
