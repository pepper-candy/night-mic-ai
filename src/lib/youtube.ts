import { RoomError } from "@/lib/room-ops";
import type { YoutubeSearchHit } from "@/lib/types";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const SEARCH_WINDOW_MS = 60_000;
const SEARCH_MAX_PER_WINDOW = 12;
const FIND_MAX_RESULTS = 5;

const searchBuckets = new Map<string, { count: number; resetAt: number }>();

interface YoutubeApiErrorBody {
  error?: {
    message?: string;
    errors?: Array<{ reason?: string; message?: string }>;
  };
}

interface YoutubeApiSearchResponse extends YoutubeApiErrorBody {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
    };
  }>;
}

interface YoutubeApiVideosResponse extends YoutubeApiErrorBody {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
    };
    contentDetails?: {
      duration?: string;
    };
  }>;
}

export function youtubeApiKey(): string | undefined {
  return process.env.YOUTUBE_API_KEY?.trim() || undefined;
}

export function assertYoutubeApiKey(): string {
  const key = youtubeApiKey();
  if (!key) {
    throw new RoomError(
      "YouTube Find link needs YOUTUBE_API_KEY. In Google Cloud, enable YouTube Data API v3, create an API key, and set it in Vercel (or .env.local).",
      503,
    );
  }
  return key;
}

export function rateLimitYoutubeSearch(ip: string): void {
  const now = Date.now();
  const key = ip || "local";
  const bucket = searchBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    searchBuckets.set(key, { count: 1, resetAt: now + SEARCH_WINDOW_MS });
    return;
  }
  if (bucket.count >= SEARCH_MAX_PER_WINDOW) {
    throw new RoomError("YouTube Find link is cooling down — try again in a minute.", 429);
  }
  bucket.count += 1;
}

function stripText(raw: string, max: number): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function thumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

export function formatIsoDuration(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return undefined;
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0) + days * 24;
  const minutes = Number(match[3] || 0);
  const seconds = Number(match[4] || 0);
  if (!hours && !minutes && !seconds) return undefined;
  if (hours) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function throwYoutubeError(data: YoutubeApiErrorBody, status: number): never {
  const reason = data.error?.errors?.[0]?.reason;
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
    throw new RoomError(
      "YouTube daily quota is used up (default 10,000 units, ~100 Find link taps). Paste a watch URL for now, or try again after the quota resets.",
      429,
    );
  }
  const message =
    stripText(data.error?.message ?? data.error?.errors?.[0]?.message ?? "", 180) ||
    `YouTube search failed (${status}).`;
  throw new RoomError(message, status >= 400 && status < 600 ? status : 502);
}

async function youtubeGet<T extends YoutubeApiErrorBody>(url: URL): Promise<T> {
  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) throwYoutubeError(data, res.status);
  return data;
}

async function hydrateDurations(
  key: string,
  hits: YoutubeSearchHit[],
): Promise<YoutubeSearchHit[]> {
  if (hits.length === 0) return hits;
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails,snippet");
  url.searchParams.set("id", hits.map((hit) => hit.videoId).join(","));
  url.searchParams.set("key", key);

  try {
    const data = await youtubeGet<YoutubeApiVideosResponse>(url);
    const byId = new Map<string, NonNullable<YoutubeApiVideosResponse["items"]>[number]>();
    for (const item of data.items ?? []) {
      const id = item.id?.trim() ?? "";
      if (VIDEO_ID_RE.test(id)) byId.set(id, item);
    }
    return hits.map((hit) => {
      const extra = byId.get(hit.videoId);
      const title = stripText(extra?.snippet?.title ?? hit.title, 120);
      const channel = stripText(extra?.snippet?.channelTitle ?? hit.channel, 80) || "YouTube";
      return {
        ...hit,
        title: title || hit.title,
        channel,
        duration: formatIsoDuration(extra?.contentDetails?.duration),
      };
    });
  } catch (error) {
    if (error instanceof RoomError && error.status === 429) throw error;
    return hits;
  }
}

export async function findYoutubeVideos(query: string): Promise<YoutubeSearchHit[]> {
  const key = assertYoutubeApiKey();
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("maxResults", String(FIND_MAX_RESULTS));
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);

  const data = await youtubeGet<YoutubeApiSearchResponse>(url);
  const hits: YoutubeSearchHit[] = [];
  const seen = new Set<string>();
  for (const item of data.items ?? []) {
    const videoId = item.id?.videoId?.trim() ?? "";
    if (!VIDEO_ID_RE.test(videoId) || seen.has(videoId)) continue;
    const title = stripText(item.snippet?.title ?? "", 120);
    if (!title) continue;
    seen.add(videoId);
    hits.push({
      videoId,
      title,
      channel: stripText(item.snippet?.channelTitle ?? "", 80) || "YouTube",
      thumbnailUrl: thumbnailUrl(videoId),
      url: watchUrl(videoId),
    });
  }
  return hydrateDurations(key, hits);
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local"
  );
}
