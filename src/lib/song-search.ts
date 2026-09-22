import {
  spotifyCatalogSearchUrl,
  youtubeKaraokeSearchUrl,
} from "@/lib/media";
import {
  MAX_URL,
  type SongLanguage,
  type SongSearchHit,
} from "@/lib/types";
/** Strip movie/OST/feat clutter so karaoke titles stay readable. */
export function cleanSongTitle(raw: string): string {
  let title = raw.trim();
  title = title.replace(
    /\s*[\(\[\{][^)\]\}]*\b(from|soundtrack|ost|theme|movie|film|feat\.?|ft\.?|with)\b[^)\]\}]*[\)\]\}]/gi,
    "",
  );
  title = title.replace(/\s*-\s*(from|theme|soundtrack|ost)\b.*$/i, "");
  title = title.replace(/\s{2,}/g, " ").trim();
  title = title.replace(/[\s\-–—:]+$/g, "").trim();
  return title || raw.trim();
}

interface ItunesResult {
  trackId?: number;
  trackName?: string;
  artistName?: string;
}

interface ItunesResponse {
  results?: ItunesResult[];
}

interface SpotifyTokenResponse {
  access_token?: string;
  expires_in?: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  external_urls?: { spotify?: string };
  artists?: Array<{ name?: string }>;
}

interface SpotifySearchResponse {
  tracks?: { items?: SpotifyTrack[] };
}

let spotifyCache: { token: string; expiresAt: number } | null = null;

function hasHangul(text: string): boolean {
  return /[\uAC00-\uD7AF]/.test(text);
}

function hasKana(text: string): boolean {
  return /[\u3040-\u30FF]/.test(text);
}

function hasCjk(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

function hasLatin(text: string): boolean {
  return /[A-Za-z]/.test(text);
}

/** Best-effort language from script + iTunes storefront. Guest can still change it. */
export function guessSongLanguage(
  title: string,
  artist: string,
  country?: string,
): { language: SongLanguage; languageOther?: string } | undefined {
  const text = `${title} ${artist}`;
  if (hasHangul(text)) return { language: "other", languageOther: "Korean" };
  if (hasKana(text)) return { language: "other", languageOther: "Japanese" };
  if (hasCjk(text)) {
    const store = (country || "").toUpperCase();
    if (store === "CN" || store === "TW") {
      return { language: "other", languageOther: "Mandarin" };
    }
    return { language: "cantonese" };
  }
  if (hasLatin(text)) return { language: "english" };
  return undefined;
}

async function getSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  if (spotifyCache && spotifyCache.expiresAt > Date.now() + 30_000) {
    return spotifyCache.token;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as SpotifyTokenResponse;
  if (!data.access_token || !data.expires_in) return null;
  spotifyCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function searchItunesCountry(
  query: string,
  country: string,
  limit: number,
): Promise<SongSearchHit[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("country", country);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as ItunesResponse;
  const hits: SongSearchHit[] = [];
  const seen = new Set<string>();

  for (const item of data.results ?? []) {
    const title = cleanSongTitle(item.trackName || "");
    const artist = (item.artistName || "").trim();
    if (!title || !artist) continue;
    const key = `${title.toLowerCase()}::${artist.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const guessed = guessSongLanguage(title, artist, country);
    hits.push({
      id: `itunes-${country}-${item.trackId ?? hits.length}`,
      title: title.slice(0, 80),
      artist: artist.slice(0, 80),
      source: country === "HK" ? "Apple Music (HK)" : "Apple Music",
      ...guessed,
    });
  }
  return hits;
}

async function searchItunes(query: string, limit: number): Promise<SongSearchHit[]> {
  // HK storefront helps Cantonese / local titles; US covers international.
  const [hk, us] = await Promise.all([
    searchItunesCountry(query, "HK", limit),
    searchItunesCountry(query, "US", limit),
  ]);
  const cjkQuery = hasCjk(query) || hasHangul(query) || hasKana(query);
  return cjkQuery ? mergeHits(hk, us) : mergeHits(us, hk);
}

async function searchSpotify(query: string, limit: number): Promise<SongSearchHit[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as SpotifySearchResponse;
  const hits: SongSearchHit[] = [];
  for (const [index, track] of (data.tracks?.items ?? []).entries()) {
    const title = cleanSongTitle(track.name || "");
    const artists: string[] = [];
    for (const a of track.artists ?? []) {
      if (a.name) artists.push(a.name);
    }
    const artist = artists.join(", ");
    if (!title || !artist) continue;
    const guessed = guessSongLanguage(title, artist);
    hits.push({
      id: `spotify-${track.id || index}`,
      title: title.slice(0, 80),
      artist: artist.slice(0, 80),
      spotifyUrl: track.external_urls?.spotify,
      source: "Spotify",
      ...guessed,
    });
  }
  return hits;
}

function mergeHits(primary: SongSearchHit[], secondary: SongSearchHit[]): SongSearchHit[] {
  const seen = new Set<string>();
  const out: SongSearchHit[] = [];
  for (const hit of [...primary, ...secondary]) {
    const key = `${hit.title.toLowerCase()}::${hit.artist.toLowerCase()}`;
    if (seen.has(key)) {
      const existing = out.find(
        (item) => `${item.title.toLowerCase()}::${item.artist.toLowerCase()}` === key,
      );
      if (existing) {
        existing.spotifyUrl = existing.spotifyUrl || hit.spotifyUrl;
        existing.url = existing.url || hit.url;
        existing.language = existing.language || hit.language;
        existing.languageOther = existing.languageOther || hit.languageOther;
      }
      continue;
    }
    seen.add(key);
    out.push({ ...hit });
  }
  return out;
}

function fitUrl(url: string): string | undefined {
  return url.length <= MAX_URL ? url : undefined;
}

function withFindLinks(hit: SongSearchHit): SongSearchHit {
  const youtube =
    hit.url ||
    youtubeKaraokeSearchUrl(hit.title, hit.artist) ||
    youtubeKaraokeSearchUrl(hit.title);
  const spotify =
    hit.spotifyUrl ||
    spotifyCatalogSearchUrl(hit.title, hit.artist) ||
    spotifyCatalogSearchUrl(hit.title);
  return {
    ...hit,
    url: fitUrl(youtube) || fitUrl(youtubeKaraokeSearchUrl(hit.title)),
    spotifyUrl: fitUrl(spotify) || fitUrl(spotifyCatalogSearchUrl(hit.title)),
  };
}

/**
 * Search songs for autocomplete / autofill.
 * Apple iTunes (US + HK) always runs — no key.
 * Every hit gets author, a language guess when possible, and YouTube / Spotify
 * search-page links so guests can tap through without API keys.
 * YouTube Data API is not used here — Find link is an explicit, quota-costly tap.
 */
export async function searchSongs(query: string, limit = 8): Promise<SongSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [itunes, spotify] = await Promise.all([
    searchItunes(q, limit),
    searchSpotify(q, limit),
  ]);

  return mergeHits(itunes, spotify).slice(0, limit).map(withFindLinks);
}
