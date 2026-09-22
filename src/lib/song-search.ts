import type { SongSearchHit } from "@/lib/types";

/** Strip movie/OST/feat clutter so karaoke titles stay readable. */
export function cleanSongTitle(raw: string): string {
  let title = raw.trim();
  title = title.replace(/\s*[\(\[\{][^)\]\}]*\b(from|soundtrack|ost|theme|movie|film|feat\.?|ft\.?|with)\b[^)\]\}]*[\)\]\}]/gi, "");
  title = title.replace(/\s*-\s*(from|theme|soundtrack|ost)\b.*$/i, "");
  title = title.replace(/\s{2,}/g, " ").trim();
  title = title.replace(/[\s\-–—:]+$/g, "").trim();
  return title || raw.trim();
}

interface ItunesResult {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
}

interface ItunesResponse {
  results?: ItunesResult[];
}

interface SpotifyTokenResponse {
  access_token?: string;
  token_type?: string;
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

interface YoutubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string };
  }>;
}

let spotifyCache: { token: string; expiresAt: number } | null = null;

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

async function searchItunes(query: string, limit: number): Promise<SongSearchHit[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", String(limit));

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
    hits.push({
      id: `itunes-${item.trackId ?? hits.length}`,
      title: title.slice(0, 80),
      artist: artist.slice(0, 80),
      source: "Apple Music",
    });
  }
  return hits;
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
    const artist = (track.artists ?? [])
      .map((a) => a.name)
      .filter(Boolean)
      .join(", ");
    if (!title || !artist) continue;
    hits.push({
      id: `spotify-${track.id || index}`,
      title: title.slice(0, 80),
      artist: artist.slice(0, 80),
      spotifyUrl: track.external_urls?.spotify,
      source: "Spotify",
    });
  }
  return hits;
}

async function searchYoutube(
  title: string,
  artist: string,
): Promise<string | undefined> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) return undefined;

  const q = `${title} ${artist} karaoke`;
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("q", q);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return undefined;
  const data = (await res.json()) as YoutubeSearchResponse;
  const videoId = data.items?.[0]?.id?.videoId;
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;
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
      }
      continue;
    }
    seen.add(key);
    out.push({ ...hit });
  }
  return out;
}

/**
 * Search songs for autocomplete / autofill.
 * Always uses Apple's free iTunes Search API for title + artist.
 * Optional: SPOTIFY_CLIENT_ID/SECRET for Spotify track links,
 * YOUTUBE_API_KEY for a YouTube karaoke link on the top hit.
 */
export async function searchSongs(query: string, limit = 8): Promise<SongSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const [itunes, spotify] = await Promise.all([
    searchItunes(q, limit),
    searchSpotify(q, limit),
  ]);

  let hits = mergeHits(itunes, spotify).slice(0, limit);

  if (hits[0] && process.env.YOUTUBE_API_KEY?.trim()) {
    const youtubeUrl = await searchYoutube(hits[0].title, hits[0].artist);
    if (youtubeUrl) {
      hits = hits.map((hit, index) => (index === 0 ? { ...hit, url: youtubeUrl } : hit));
    }
  }

  return hits;
}
