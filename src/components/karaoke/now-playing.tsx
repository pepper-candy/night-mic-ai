"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LinkPreview } from "@/components/karaoke/link-preview";
import { VerifiedBadge } from "@/components/karaoke/verified-badge";
import {
  YoutubeHostPlayer,
  type YoutubeHostPlayerHandle,
} from "@/components/karaoke/youtube-host-player";
import { languageLabel, LYRICS_BUTTON_LABEL, lyricsSearchUrl, youtubeVideoId } from "@/lib/media";
import { timeAgo } from "@/lib/time";
import type { QueueItem } from "@/lib/types";
import { ExternalLinkIcon, PauseIcon, PlayIcon, SkipForwardIcon } from "lucide-react";

export function NowPlaying({
  song,
  isHost,
  showLyrics = true,
  showEmbed = false,
  onSkip,
}: {
  song: QueueItem | null;
  isHost?: boolean;
  showLyrics?: boolean;
  /** Embed YouTube/Spotify like the cohost preview, for the song that is on. */
  showEmbed?: boolean;
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

  return (
    <NowPlayingCard
      song={song}
      isHost={isHost}
      showLyrics={showLyrics}
      showEmbed={showEmbed}
      onSkip={onSkip}
    />
  );
}

function NowPlayingCard({
  song,
  isHost,
  showLyrics,
  showEmbed,
  onSkip,
}: {
  song: QueueItem;
  isHost?: boolean;
  showLyrics: boolean;
  showEmbed: boolean;
  onSkip?: () => void;
}) {
  const playerRef = useRef<YoutubeHostPlayerHandle>(null);
  const [playing, setPlaying] = useState(false);
  const lang = song.language
    ? languageLabel(song.language, song.languageOther)
    : undefined;
  const youtubeHref = song.url?.trim() || undefined;
  const spotifyHref = song.spotifyUrl?.trim() || undefined;
  const ytId = youtubeVideoId(song.url);
  const hostPlayer = Boolean(isHost && showEmbed && ytId);

  return (
    <section className="now-playing px-5 py-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Now singing</p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {song.modified ? <VerifiedBadge /> : null}
          {lang ? (
            <Badge variant="secondary" className="bg-gold/20 text-gold">
              {lang}
            </Badge>
          ) : null}
        </div>
      </div>
      <h2 className="mt-2 font-display text-4xl leading-none tracking-wide sm:text-5xl">
        {song.title}
      </h2>
      {song.artist.trim() ? (
        <p className="mt-2 text-lg text-primary-foreground/85">{song.artist}</p>
      ) : null}
      {song.message?.trim() ? (
        <p className="mt-2 text-base italic text-primary-foreground/80">
          &ldquo;{song.message.trim()}&rdquo;
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted-foreground">
        {song.submittedBy}
        {song.startedAt ? ` · started ${timeAgo(song.startedAt)}` : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {showLyrics ? (
          <Button
            variant="outline"
            className="h-12 min-h-12 max-w-full flex-1 truncate"
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
        {hostPlayer ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 min-h-12 flex-1"
            onClick={() => playerRef.current?.toggle()}
          >
            {playing ? (
              <PauseIcon data-icon="inline-start" />
            ) : (
              <PlayIcon data-icon="inline-start" />
            )}
            {playing ? "Pause" : "Play"}
          </Button>
        ) : youtubeHref ? (
          <Button
            variant="outline"
            className="h-12 min-h-12 flex-1"
            render={<a href={youtubeHref} target="_blank" rel="noreferrer" />}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            YouTube
          </Button>
        ) : null}
        {spotifyHref && !hostPlayer ? (
          <Button
            variant="outline"
            className="h-12 min-h-12 flex-1"
            render={<a href={spotifyHref} target="_blank" rel="noreferrer" />}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            Spotify
          </Button>
        ) : null}
        {isHost && onSkip ? (
          <Button className="h-12 min-h-12 flex-1 neon-button" onClick={onSkip}>
            <SkipForwardIcon data-icon="inline-start" />
            Skip / next
          </Button>
        ) : null}
      </div>
      {hostPlayer && ytId ? (
        <div className="mt-4 space-y-2">
          <YoutubeHostPlayer
            ref={playerRef}
            videoId={ytId}
            onPlayingChange={setPlaying}
            onEnded={onSkip}
          />
          {youtubeHref ? (
            <a
              href={youtubeHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-cyan"
            >
              <ExternalLinkIcon className="size-3.5" />
              Open on YouTube
            </a>
          ) : null}
        </div>
      ) : showEmbed && (youtubeHref || spotifyHref) ? (
        <div className="mt-4">
          <LinkPreview url={song.url} spotifyUrl={song.spotifyUrl} />
        </div>
      ) : isHost && showEmbed ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No YouTube video on this song yet. Search from Add a song or edit the queue item.
        </p>
      ) : null}
    </section>
  );
}
