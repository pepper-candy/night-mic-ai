"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  languageLabel,
  LYRICS_BUTTON_LABEL,
  lyricsSearchUrl,
  spotifyCatalogSearchUrl,
  youtubeKaraokeSearchUrl,
} from "@/lib/media";
import { timeAgo } from "@/lib/time";
import type { QueueItem } from "@/lib/types";
import { ExternalLinkIcon, SkipForwardIcon } from "lucide-react";

export function NowPlaying({
  song,
  isHost,
  showLyrics = true,
  onSkip,
}: {
  song: QueueItem | null;
  isHost?: boolean;
  showLyrics?: boolean;
  onSkip?: () => void;
}) {
  if (!song) {
    return (
      <section className="now-playing-empty px-5 py-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan">Now playing</p>
        <h2 className="mt-2 font-display text-3xl tracking-wide">Mic is open</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Promote the next singer when the room is ready.
        </p>
      </section>
    );
  }

  const lang = languageLabel(song.language || "english", song.languageOther);
  const youtubeHref = song.url || youtubeKaraokeSearchUrl(song.title, song.artist);
  const spotifyHref = song.spotifyUrl || spotifyCatalogSearchUrl(song.title, song.artist);

  return (
    <section className="now-playing px-5 py-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Now singing</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-4xl leading-none tracking-wide sm:text-5xl">
          {song.title}
        </h2>
        <Badge variant="secondary" className="bg-gold/20 text-gold">
          {lang}
        </Badge>
      </div>
      <p className="mt-2 text-lg text-primary-foreground/85">{song.artist}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {song.submittedBy}
        {song.modified ? " (modified)" : ""}
        {song.startedAt ? ` · started ${timeAgo(song.startedAt)}` : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {showLyrics ? (
          <Button
            variant="outline"
            className="h-12 max-w-full flex-1 truncate"
            render={
              <a
                href={lyricsSearchUrl(song.title, song.language)}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            {LYRICS_BUTTON_LABEL}
          </Button>
        ) : null}
        {youtubeHref ? (
          <Button
            variant="outline"
            className="h-12 flex-1"
            render={<a href={youtubeHref} target="_blank" rel="noreferrer" />}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            YouTube / karaoke
          </Button>
        ) : null}
        {spotifyHref ? (
          <Button
            variant="outline"
            className="h-12 flex-1"
            render={<a href={spotifyHref} target="_blank" rel="noreferrer" />}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            Spotify
          </Button>
        ) : null}
        {isHost && onSkip ? (
          <Button className="h-12 flex-1 neon-button" onClick={onSkip}>
            <SkipForwardIcon data-icon="inline-start" />
            Skip / next
          </Button>
        ) : null}
      </div>
    </section>
  );
}
