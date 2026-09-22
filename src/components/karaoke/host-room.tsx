"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddSongForm } from "@/components/karaoke/add-song-form";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { EditSongDialog } from "@/components/karaoke/edit-song-dialog";
import { EventSettingsPanel } from "@/components/karaoke/event-settings-panel";
import { NowPlaying } from "@/components/karaoke/now-playing";
import { QueueGatePanel } from "@/components/karaoke/queue-gate-panel";
import { SharePanel } from "@/components/karaoke/share-panel";
import { SongRow } from "@/components/karaoke/song-row";
import { EmptyQueue, ErrorState, LoadingState, LockedHost } from "@/components/karaoke/states";
import { ValidationSettingsPanel } from "@/components/karaoke/validation-settings-panel";
import { Button } from "@/components/ui/button";
import { saveHostToken, useHasHydrated, useHostToken } from "@/hooks/use-identity";
import { useRoom } from "@/hooks/use-room";
import { queueAction, songAction } from "@/lib/api-client";
import type { PublicRoom, QueueItem } from "@/lib/types";

export function HostRoom({
  code,
  hostTokenFromUrl,
}: {
  code: string;
  hostTokenFromUrl?: string;
}) {
  const { room, error, loading, apply, refresh } = useRoom(code);
  const storedToken = useHostToken(code);
  const hydrated = useHasHydrated();
  const hostToken = hostTokenFromUrl || storedToken || undefined;
  const authorized = Boolean(hostToken);
  const [editing, setEditing] = useState<QueueItem | null>(null);
  const [cohostToken, setCohostToken] = useState<string | undefined>();

  useEffect(() => {
    if (hostTokenFromUrl) {
      saveHostToken(code, hostTokenFromUrl);
    }
  }, [code, hostTokenFromUrl, storedToken]);

  if (loading && !room) {
    return (
      <AppShell>
        <BrandMark compact />
        <LoadingState label="Opening the booth…" />
      </AppShell>
    );
  }

  if (error && !room) {
    return (
      <AppShell>
        <BrandMark compact />
        <ErrorState
          title="Can't find that room"
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
        <LoadingState label="Opening the booth…" />
      </AppShell>
    );
  }

  if (!authorized) {
    return (
      <AppShell>
        <BrandMark compact />
        <LockedHost />
        <Button className="mt-4 h-12" render={<Link href={`/room/${code}`} />}>
          Join as a guest
        </Button>
      </AppShell>
    );
  }

  if (!room) {
    return (
      <AppShell>
        <BrandMark compact />
        <LoadingState />
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

  return (
    <AppShell>
      <header className="mb-5 flex items-center justify-between gap-3">
        <BrandMark compact />
        <Button variant="ghost" className="h-12 min-h-12 text-cyan" render={<Link href={`/room/${code}`} />}>
          Guest view
        </Button>
      </header>

      {room.persistence === "memory" ? (
        <p className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
          This instance has no Redis yet, so the queue lives in memory. Add Upstash
          for a real party across phones.
        </p>
      ) : null}

      <SharePanel code={code} hostToken={hostToken} hasEvent={Boolean(room.event)} />

      <div className="mt-4 space-y-4">
        <EventSettingsPanel code={code} event={room.event} onUpdated={apply} />
        <ValidationSettingsPanel
          code={code}
          enabled={room.validationEnabled}
          cohostToken={cohostToken}
          onUpdated={(next, token) => {
            apply(next);
            if (token) setCohostToken(token);
          }}
        />
        <QueueGatePanel
          key={`${room.queueOpen}-${room.queueOpensAt ?? "none"}`}
          code={code}
          room={room}
          onUpdated={apply}
        />
      </div>

      <div className="mt-4">
        <NowPlaying
          song={room.nowPlaying}
          isHost
          showLyrics={false}
          showEmbed
          onSkip={() => void run(() => queueAction(code, "skip"), "Next singer, you're up.")}
        />
      </div>

      <section className="mt-6 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl tracking-wide">Up next</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {room.upNext.length} waiting
          </p>
        </div>

        {room.upNext.length === 0 && !room.nowPlaying ? (
          <EmptyQueue
            title="No songs yet"
            message="Share the code, or drop in three karaoke classics so the night has a pulse."
          >
            <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
              <Button
                className="h-12 min-h-12 flex-1"
                onClick={() => void run(() => queueAction(code, "seed"), "Classics are on the list.")}
              >
                Add 3 classics
              </Button>
            </div>
          </EmptyQueue>
        ) : room.upNext.length === 0 ? (
          <EmptyQueue
            title="Nobody waiting"
            message="The current singer has the room. Guests can still add the next track."
          />
        ) : (
          room.upNext.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index + 1}
              isHost
              isStaff
              canMoveUp={index > 0}
              canMoveDown={index < room.upNext.length - 1}
              onPlay={() => void run(() => songAction(code, song.id, "play"), "They're up.")}
              onRemove={() => void run(() => songAction(code, song.id, "remove"))}
              onEdit={() => setEditing(song)}
              onMove={(direction) =>
                void run(() => queueAction(code, "move", { id: song.id, direction }))
              }
            />
          ))
        )}
      </section>

      <div className="mt-4">
        <AddSongForm code={code} onAdded={apply} asName="Host" />
      </div>

      {room.done.length > 0 ? (
        <section className="mt-8 space-y-3 pb-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl tracking-wide text-muted-foreground">
              Already sung
            </h2>
            <Button
              variant="ghost"
              className="h-12 min-h-12 text-sm"
              onClick={() => void run(() => queueAction(code, "clearDone"), "History wiped.")}
            >
              Clear done
            </Button>
          </div>
          {room.done.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              isHost
              isStaff
              onRemove={() => void run(() => songAction(code, song.id, "remove"))}
              onPlay={() => void run(() => songAction(code, song.id, "play"), "Encore.")}
              onEdit={() => setEditing(song)}
            />
          ))}
        </section>
      ) : (
        <div className="h-6" />
      )}

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
