"use client";

import Link from "next/link";
import { toast } from "sonner";
import { AddSongForm } from "@/components/karaoke/add-song-form";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { JoinForm } from "@/components/karaoke/join-form";
import { NowPlaying } from "@/components/karaoke/now-playing";
import { SongRow } from "@/components/karaoke/song-row";
import { EmptyQueue, ErrorState, LoadingState } from "@/components/karaoke/states";
import { Button } from "@/components/ui/button";
import {
  useCohostToken,
  useGuestId,
  useHasHydrated,
  useHostToken,
  useRoomNickname,
} from "@/hooks/use-identity";
import { useRoom } from "@/hooks/use-room";
import { songAction } from "@/lib/api-client";
import { formatCode } from "@/lib/codes";

export function GuestRoom({ code }: { code: string }) {
  const { room, error, loading, apply, refresh } = useRoom(code);
  const guestId = useGuestId();
  const nickname = useRoomNickname(code);
  const hostToken = useHostToken(code);
  const cohostToken = useCohostToken(code);
  const isHost = Boolean(hostToken);
  const isStaff = Boolean(isHost || cohostToken);
  const hydrated = useHasHydrated();
  const name = nickname || (isHost ? "Host" : isStaff ? "Cohost" : "");

  if (loading && !room) {
    return (
      <AppShell>
        <BrandMark compact />
        <LoadingState />
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
        <Button variant="ghost" className="mt-2 h-11" render={<Link href="/join" />}>
          Enter a different code
        </Button>
      </AppShell>
    );
  }

  if (!hydrated) {
    return (
      <AppShell>
        <BrandMark compact />
        <LoadingState />
      </AppShell>
    );
  }

  if (!nickname && !isStaff) {
    return (
      <AppShell>
        <BrandMark />
        <div className="mt-8 glow-panel p-5">
          <JoinForm initialCode={code} />
        </div>
      </AppShell>
    );
  }

  if (!room) return null;

  async function onCancel(id: string) {
    try {
      apply(await songAction(code, id, "cancel", { guestId }));
      toast.success("Pulled it from the list.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel that song.");
    }
  }

  return (
    <AppShell>
      <header className="mb-5 flex items-center justify-between gap-3">
        <BrandMark compact />
        <div className="text-right">
          <p className="font-display text-2xl tracking-wide text-gold">{formatCode(code)}</p>
          <p className="text-xs text-muted-foreground">Singing as {name}</p>
        </div>
      </header>

      {isHost ? (
        <Button variant="outline" className="mb-4 h-11" render={<Link href={`/room/${code}/host`} />}>
          Open host controls
        </Button>
      ) : null}

      <NowPlaying song={room.nowPlaying} />

      <div className="mt-4">
        <AddSongForm
          code={code}
          onAdded={apply}
          asName={!nickname && isStaff ? (isHost ? "Host" : "Cohost") : undefined}
        />
      </div>

      <section className="mt-6 space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-wide">Up next</h2>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {room.upNext.length} waiting
          </p>
        </div>
        {room.upNext.length === 0 ? (
          <EmptyQueue
            title="The mic is lonely"
            message="Be the first to grab it. Then you're on the list."
          />
        ) : (
          room.upNext.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index + 1}
              isOwn={song.submitterId === guestId}
              onCancel={() => void onCancel(song.id)}
            />
          ))
        )}
      </section>

      {room.done.length > 0 ? (
        <section className="mt-8 space-y-3 pb-6">
          <h2 className="font-display text-3xl tracking-wide text-muted-foreground">Already sung</h2>
          {room.done.map((song) => (
            <SongRow key={song.id} song={song} isOwn={song.submitterId === guestId} />
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}
