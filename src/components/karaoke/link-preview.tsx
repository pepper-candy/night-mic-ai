"use client";

import {
  isSpotifySearchUrl,
  isYoutubeResultsUrl,
  spotifyEmbedUrl,
  youtubeVideoId,
} from "@/lib/media";

export function LinkPreview({
  url,
  spotifyUrl,
}: {
  url?: string;
  spotifyUrl?: string;
}) {
  const yt = youtubeVideoId(url);
  const spotify = spotifyEmbedUrl(spotifyUrl) || spotifyEmbedUrl(url);
  const ytSearch = !yt && isYoutubeResultsUrl(url) ? url : null;
  const spotifySearch =
    !spotify && (isSpotifySearchUrl(spotifyUrl) || isSpotifySearchUrl(url))
      ? spotifyUrl || url
      : null;

  if (!yt && !spotify && !ytSearch && !spotifySearch) {
    return (
      <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
        No YouTube or Spotify link on this song yet. Search-autofill adds a karaoke
        search page even without API keys; add keys for an embedded video.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {yt ? (
        <div className="overflow-hidden rounded-xl border border-border bg-black">
          <iframe
            title="YouTube preview"
            src={`https://www.youtube.com/embed/${yt}`}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : ytSearch ? (
        <a
          href={ytSearch}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm text-cyan"
        >
          Open YouTube karaoke search (no exact video until YOUTUBE_API_KEY is set)
        </a>
      ) : null}
      {spotify ? (
        <iframe
          title="Spotify preview"
          src={spotify}
          className="h-[152px] w-full rounded-xl border-0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : spotifySearch ? (
        <a
          href={spotifySearch}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-3 text-sm text-cyan"
        >
          Open Spotify search (add Spotify API keys for an embedded track)
        </a>
      ) : null}
    </div>
  );
}
