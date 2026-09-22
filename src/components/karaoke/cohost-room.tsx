"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { EditSongDialog } from "@/components/karaoke/edit-song-dialog";
import { LinkPreview } from "@/components/karaoke/link-preview";
import { NowPlaying } from "@/components/karaoke/now-playing";
import { SongRow } from "@/components/karaoke/song-row";
import { EmptyQueue, ErrorState, LoadingState } from "@/components/karaoke/states";
import { Button } from "@/components/ui/button";
import {
  saveCohostToken,
  saveDisplayName,
  useCohostToken,
  useHasHydrated,
  useHostToken,
} from "@/hooks/use-identity";
import { useRoom } from "@/hooks/use-room";
import { songAction } from "@/lib/api-client";
import { formatCode } from "@/lib/codes";
import type { PublicRoom, QueueItem } from "@/lib/types";

export function CohostRoom({
  code,
  cohostTokenFromUrl,
}: {
  code: string;
  cohostTokenFromUrl?: string;
}) {
  const { room, error, loading, apply, refresh } = useRoom(code);
  const storedCohost = useCohostToken(code);
  const hostToken = useHostToken(code);
  const hydrated = useHasHydrated();
  const cohostToken = cohostTokenFromUrl || storedCohost || undefined;
  const authorized = Boolean(cohostToken || hostToken);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editing, setEditing] = useState<QueueItem | null>(null);

  useEffect(() => {
    if (cohostTokenFromUrl) {
      saveCohostToken(code, cohostTokenFromUrl);
    }
    if (cohostTokenFromUrl || storedCohost) {
      saveDisplayName("Cohost");
    }
  }, [code, cohostTokenFromUrl, storedCohost]);

  if (loading && !room) {
    return (
      <AppShell>
        <BrandMark compact />
        <LoadingState label="Opening cohost desk…" />
      </AppShell>
    );
  }

  if (error && !room) {
    return (
      <AppShell>
        <BrandMark compact />
        <ErrorState
          title="Room went quiet"
          message={error}
          actionLabel="Try again"
          onAction={() => void refresh()}
        />
      </AppShell>
    );
  }

  if (!hydrated) {
    return (
      <AppShell>
        <BrandMark compact />
        <LoadingState label="Opening cohost desk…" />
      </AppShell>
    );
  }

  if (!authorized) {
    return (
      <AppShell>
        <BrandMark compact />
        <div className="glow-panel space-y-3 p-5">
          <h1 className="font-display text-3xl tracking-wide">Cohost link required</h1>
          <p className="text-sm text-muted-foreground">
            Ask the host to turn on link validation and send you the cohost preview link.
          </p>
          <Button className="h-12 w-full" render={<Link href={`/room/${code}`} />}>
            Join as guest instead
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!room) return null;

  if (!room.validationEnabled && !hostToken) {
    return (
      <AppShell>
        <BrandMark compact />
        <div className="glow-panel space-y-3 p-5">
          <h1 className="font-display text-3xl tracking-wide">Validation is off</h1>
          <p className="text-sm text-muted-foreground">
            The host turned off link validation for room {formatCode(code)}.
          </p>
          <Button className="h-12 w-full" render={<Link href={`/room/${code}`} />}>
            Open guest view
          </Button>
        </div>
      </AppShell>
    );
  }

  async function run(action: () => Promise<PublicRoom>, ok?: string) {
    try {
      apply(await action());
      if (ok) toast.success(ok);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That control missed.");
    }
  }

  const previewSong =
    room.queue.find((song) => song.id === previewId) ||
    room.nowPlaying ||
    room.upNext[0] ||
    null;

  return (
    <AppShell>
      <header className="mb-5 flex items-center justify-between gap-3">
        <BrandMark compact />
        <div className="text-right">
          <p className="font-display text-2xl tracking-wide text-gold">{formatCode(code)}</p>
          <p className="text-xs text-muted-foreground">Cohost · link validation</p>
        </div>
      </header>

      <section className="glow-panel mb-4 space-y-2 p-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan">Your job</p>
        <p className="text-sm text-muted-foreground">
          Tap <span className="text-foreground">Preview link</span> on a song to embed YouTube
          or Spotify here. Edit or remove anything inappropriate. After an edit, the card shows
          the requester name with (modified).
        </p>
      </section>

      <NowPlaying song={room.nowPlaying} />

      {previewSong ? (
        <section className="mt-4 space-y-2">
          <div className="flex items-end justify-between gap-2">
            <h2 className="font-display text-2xl tracking-wide">Embed preview</h2>
            <p className="truncate text-xs text-muted-foreground">{previewSong.title}</p>
          </div>
          <LinkPreview url={previewSong.url} spotifyUrl={previewSong.spotifyUrl} />
        </section>
      ) : null}

      <section className="mt-6 space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide">Up next</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {room.upNext.length} waiting
          </p>
        </div>
        {room.upNext.length === 0 ? (
          <EmptyQueue title="Queue is empty" message="Nothing to validate yet." />
        ) : (
          room.upNext.map((song, index) => (
            <div key={song.id} className="space-y-2">
              <SongRow
                song={song}
                index={index + 1}
                isStaff
                showPreview
                previewOpen={previewId === song.id}
                onTogglePreview={() =>
                  setPreviewId((current) => (current === song.id ? null : song.id))
                }
                onRemove={() => void run(() => songAction(code, song.id, "remove"))}
                onEdit={() => setEditing(song)}
              />
              {previewId === song.id ? (
                <LinkPreview url={song.url} spotifyUrl={song.spotifyUrl} />
              ) : null}
            </div>
          ))
        )}
      </section>

      {room.nowPlaying ? (
        <section className="mt-6 space-y-2">
          <h2 className="font-display text-2xl tracking-wide text-muted-foreground">
            Now playing controls
          </h2>
          <SongRow
            song={room.nowPlaying}
            isStaff
            showPreview
            previewOpen={previewId === room.nowPlaying.id}
            onTogglePreview={() =>
              setPreviewId((current) =>
                current === room.nowPlaying!.id ? null : room.nowPlaying!.id,
              )
            }
            onRemove={() => void run(() => songAction(code, room.nowPlaying!.id, "remove"))}
            onEdit={() => setEditing(room.nowPlaying)}
          />
        </section>
      ) : null}

      <div className="mt-6 pb-8">
        <Button variant="ghost" className="h-11 w-full" render={<Link href={`/room/${code}`} />}>
          Open guest view
        </Button>
      </div>

      <EditSongDialog
        code={code}
        song={editing}
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSaved={apply}
      />
    </AppShell>
  );
}
