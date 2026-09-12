"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/time";
import type { QueueItem } from "@/lib/types";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  PlayIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

export function SongRow({
  song,
  index,
  isOwn,
  isHost,
  canMoveUp,
  canMoveDown,
  onPlay,
  onRemove,
  onCancel,
  onMove,
}: {
  song: QueueItem;
  index?: number;
  isOwn?: boolean;
  isHost?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onPlay?: () => void;
  onRemove?: () => void;
  onCancel?: () => void;
  onMove?: (direction: "up" | "down") => void;
}) {
  return (
    <article className="glow-panel p-3.5">
      <div className="flex items-start gap-3">
        {typeof index === "number" ? (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg text-gold">
            {index}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold leading-tight">{song.title}</h3>
            {isOwn ? (
              <Badge variant="secondary" className="bg-cyan/15 text-cyan">
                You
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {song.submittedBy} · {timeAgo(song.createdAt)}
          </p>
          {song.url ? (
            <a
              href={song.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-cyan underline-offset-4 hover:underline"
            >
              Open track
              <ExternalLinkIcon className="size-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      {(isHost || (isOwn && song.status === "queued")) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {isHost && song.status === "queued" && onPlay ? (
            <Button className="h-11 flex-1 text-sm" onClick={onPlay}>
              <PlayIcon data-icon="inline-start" />
              Now playing
            </Button>
          ) : null}
          {isHost && song.status === "queued" && onMove ? (
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
          {isHost && onRemove ? (
            <Button
              variant="destructive"
              className="h-11 px-3"
              onClick={onRemove}
              aria-label="Remove song"
            >
              <Trash2Icon />
            </Button>
          ) : null}
          {!isHost && isOwn && song.status === "queued" && onCancel ? (
            <Button variant="outline" className="h-11 flex-1" onClick={onCancel}>
              <XIcon data-icon="inline-start" />
              Cancel my song
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}
