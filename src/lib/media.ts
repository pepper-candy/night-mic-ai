/** YouTube results page — tap to pick a karaoke video. No API key. */
export function youtubeKaraokeSearchUrl(title: string, artist = ""): string {
  const q = [title.trim(), artist.trim(), "karaoke"].filter(Boolean).join(" ");
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

/** Spotify catalog search page — tap to find the track. No API key. */
export function spotifyCatalogSearchUrl(title: string, artist = ""): string {
  const q = [title.trim(), artist.trim()].filter(Boolean).join(" ");
  return `https://open.spotify.com/search/${encodeURIComponent(q)}`;
}

function mediaHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** One paste box: YouTube URLs go to `url`, everything else to Spotify. */
export function assignMediaLink(raw: string): { url?: string; spotifyUrl?: string } {
  const value = raw.trim();
  if (!value) return {};
  const host = mediaHost(value);
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "music.youtube.com"
  ) {
    return { url: value };
  }
  return { spotifyUrl: value };
}

export function combinedMediaLink(url?: string, spotifyUrl?: string): string {
  return (spotifyUrl || url || "").trim();
}

export function isYoutubeResultsUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    return (
      (host === "youtube.com" || host === "m.youtube.com") &&
      parsed.pathname === "/results"
    );
  } catch {
    return false;
  }
}

export function isSpotifySearchUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    return (
      (host === "open.spotify.com" || host === "spotify.com") &&
      parsed.pathname.startsWith("/search")
    );
  } catch {
    return false;
  }
}

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

/** Google lyrics search query — Cantonese uses 歌詞, everything else uses Lyrics. */
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

export const LYRICS_BUTTON_LABEL = "🔍 Find me the Lyrics";
