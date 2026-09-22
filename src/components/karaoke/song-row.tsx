"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/karaoke/verified-badge";
import { languageLabel, LYRICS_BUTTON_LABEL, lyricsSearchUrl } from "@/lib/media";
import { timeAgo } from "@/lib/time";
import type { QueueItem } from "@/lib/types";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

export function SongRow({
  song,
  index,
  isOwn,
  isHost,
  isStaff,
  canMoveUp,
  canMoveDown,
  showPreview,
  previewOpen,
  onTogglePreview,
  onPlay,
  onRemove,
  onCancel,
  onMove,
  onEdit,
}: {
  song: QueueItem;
  index?: number;
  isOwn?: boolean;
  isHost?: boolean;
  /** Host or cohost — can edit/remove. */
  isStaff?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  showPreview?: boolean;
  previewOpen?: boolean;
  onTogglePreview?: () => void;
  onPlay?: () => void;
  onRemove?: () => void;
  onCancel?: () => void;
  onMove?: (direction: "up" | "down") => void;
  onEdit?: () => void;
}) {
  const staff = Boolean(isStaff || isHost);
  const showHostQueueActions = Boolean(isHost && song.status === "queued" && (onPlay || onMove));
  const showGuestCancel = Boolean(!staff && isOwn && song.status === "queued" && onCancel);
  const lang = song.language
    ? languageLabel(song.language, song.languageOther)
    : undefined;
  const youtubeHref = song.url?.trim() || undefined;
  const spotifyHref = song.spotifyUrl?.trim() || undefined;

  return (
    <article className="glow-panel p-3.5">
      <div className="flex items-start gap-3">
        {typeof index === "number" ? (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg text-gold">
            {index}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold leading-tight">{song.title}</h3>
                {song.modified ? <VerifiedBadge /> : null}
                {lang ? (
                  <Badge variant="secondary" className="bg-gold/15 text-gold">
                    {lang}
                  </Badge>
                ) : null}
                {isOwn ? (
                  <Badge variant="secondary" className="bg-cyan/15 text-cyan">
                    You
                  </Badge>
                ) : null}
              </div>
              {song.artist.trim() ? (
                <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
              ) : null}
              {song.message?.trim() ? (
                <p className="mt-1 text-sm italic text-foreground/85">&ldquo;{song.message.trim()}&rdquo;</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {song.submittedBy}
                {" · "}
                {timeAgo(song.createdAt)}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {!staff ? (
                  <a
                    href={lyricsSearchUrl(song.title, song.language)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate text-sm text-gold underline-offset-4 hover:underline"
                    title="Search lyrics on Google"
                  >
                    {LYRICS_BUTTON_LABEL}
                  </a>
                ) : null}
                {youtubeHref ? (
                  <a
                    href={youtubeHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-cyan underline-offset-4 hover:underline"
                  >
                    YouTube
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                ) : null}
                {spotifyHref ? (
                  <a
                    href={spotifyHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-cyan underline-offset-4 hover:underline"
                  >
                    Spotify
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
            {staff && onRemove ? (
              <Button
                variant="destructive"
                size="icon"
                className="size-11 shrink-0"
                onClick={onRemove}
                aria-label="Remove song"
              >
                <Trash2Icon />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {showHostQueueActions || showGuestCancel || (staff && onEdit) || showPreview ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {showHostQueueActions && onPlay ? (
            <Button className="h-11 flex-1 text-sm" onClick={onPlay}>
              <PlayIcon data-icon="inline-start" />
              Now playing
            </Button>
          ) : null}
          {staff && onEdit ? (
            <Button variant="outline" className="h-11 flex-1" onClick={onEdit}>
              <PencilIcon data-icon="inline-start" />
              Edit
            </Button>
          ) : null}
          {showPreview && onTogglePreview ? (
            <Button variant="outline" className="h-11 flex-1" onClick={onTogglePreview}>
              {previewOpen ? "Hide preview" : "Preview link"}
            </Button>
          ) : null}
          {showGuestCancel ? (
            <Button variant="outline" className="h-11 flex-1" onClick={onCancel}>
              <XIcon data-icon="inline-start" />
              Cancel my song
            </Button>
          ) : null}
          {showHostQueueActions && onMove ? (
            <>
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                disabled={!canMoveUp}
                aria-label="Move up"
                onClick={() => onMove("up")}
              >
                <ChevronUpIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                disabled={!canMoveDown}
                aria-label="Move down"
                onClick={() => onMove("down")}
              >
                <ChevronDownIcon />
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
