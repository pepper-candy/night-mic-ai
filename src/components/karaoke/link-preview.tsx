"use client";

import { spotifyEmbedUrl, youtubeVideoId } from "@/lib/media";

export function LinkPreview({
  url,
  spotifyUrl,
}: {
  url?: string;
  spotifyUrl?: string;
}) {
  const yt = youtubeVideoId(url);
  const spotify = spotifyEmbedUrl(spotifyUrl) || spotifyEmbedUrl(url);

  if (!yt && !spotify) {
    return (
      <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
        No embeddable YouTube or Spotify link on this song yet.
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
      ) : null}
      {spotify ? (
        <iframe
          title="Spotify preview"
          src={spotify}
          className="h-[152px] w-full rounded-xl border-0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}
