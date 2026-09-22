"use client";

import Link from "next/link";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { DescriptionNote } from "@/components/karaoke/description-note";
import { EventCountdown } from "@/components/karaoke/event-countdown";
import { JoinForm } from "@/components/karaoke/join-form";
import { MusicScoreScope } from "@/components/karaoke/music-score-scope";
import { ErrorState, LoadingState } from "@/components/karaoke/states";
import { Button } from "@/components/ui/button";
import { useRoom } from "@/hooks/use-room";
import { formatCode } from "@/lib/codes";
import { MapPinIcon } from "lucide-react";

export function InvitePage({ code }: { code: string }) {
  const { room, error, loading, refresh } = useRoom(code);

  if (loading && !room) {
    return (
      <AppShell>
        <BrandMark compact />
        <LoadingState label="Loading invitation…" />
      </AppShell>
    );
  }

  if (error && !room) {
    return (
      <AppShell>
        <BrandMark compact />
        <ErrorState
          title="Invitation not found"
          message={error}
          actionLabel="Try again"
          onAction={() => void refresh()}
        />
      </AppShell>
    );
  }

  if (!room) return null;

  const event = room.event;

  return (
    <AppShell>
      <header className="mb-6">
        <BrandMark />
        <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-cyan">You&apos;re invited</p>
        <h1 className="mt-2 font-display text-5xl leading-none tracking-wide sm:text-6xl">
          {event?.title || "Karaoke night"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Room <span className="text-gold">{formatCode(code)}</span>
        </p>
      </header>

      <MusicScoreScope className="-mx-2 px-3 py-5 sm:-mx-3 sm:px-4">
        {event ? (
          <div className="space-y-4">
            <EventCountdown startsAt={event.startsAt} timezone={event.timezone} />
            {event.description ? <DescriptionNote text={event.description} /> : null}
            {event.location ? (
              <p className="flex items-start gap-2 px-1 text-sm text-muted-foreground">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-cyan" />
                <span>{event.location}</span>
              </p>
            ) : null}
          </div>
        ) : (
          <section className="glow-panel space-y-3 p-5">
            <p className="font-display text-3xl tracking-wide">Room is live</p>
            <p className="text-sm text-muted-foreground">
              The host hasn&apos;t published invite details yet. You can still join and add songs.
            </p>
          </section>
        )}

        <div className="mt-8 glow-panel p-5">
          <JoinForm initialCode={code} />
        </div>
      </MusicScoreScope>

      <div className="mt-3 pb-6">
        <Button variant="ghost" className="h-11 w-full" render={<Link href="/" />}>
          Home
        </Button>
      </div>
    </AppShell>
  );
}
