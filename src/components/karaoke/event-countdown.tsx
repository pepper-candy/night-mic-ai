"use client";

import { useEffect, useState } from "react";
import { DescriptionNote } from "@/components/karaoke/description-note";
import { eventTimezoneLabel, formatEventWhen } from "@/lib/event-time";
import { countdownParts } from "@/lib/time";
import type { EventInfo } from "@/lib/types";
import { MapPinIcon } from "lucide-react";

function Pad({ value }: { value: number }) {
  return <span className="tabular-nums">{String(value).padStart(2, "0")}</span>;
}

export function EventCountdown({
  startsAt,
  timezone,
}: {
  startsAt: number;
  timezone?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = countdownParts(startsAt, now);
  const zoneNote = (
    <p className="mt-3 text-sm text-muted-foreground">
      {formatEventWhen(startsAt, timezone)}
      <span className="mt-1 block text-xs">
        {eventTimezoneLabel(timezone)}
      </span>
    </p>
  );

  if (parts.done) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/10 px-4 py-5 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">It&apos;s time</p>
        <p className="mt-2 font-display text-4xl tracking-wide text-gold">Doors are open</p>
        <p className="mt-1 text-sm text-muted-foreground">Join the room and get on the list.</p>
        {zoneNote}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan/30 bg-cyan/5 px-4 py-5 text-center">
      <p className="text-[11px] uppercase tracking-[0.28em] text-cyan">Starts in</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {[
          { label: "Days", value: parts.days },
          { label: "Hrs", value: parts.hours },
          { label: "Min", value: parts.minutes },
          { label: "Sec", value: parts.seconds },
        ].map((unit) => (
          <div key={unit.label} className="rounded-xl bg-secondary/80 px-2 py-3">
            <p className="font-display text-3xl leading-none tracking-wide text-gold sm:text-4xl">
              <Pad value={unit.value} />
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {unit.label}
            </p>
          </div>
        ))}
      </div>
      {zoneNote}
    </div>
  );
}

/** Live countdown + details for guests who joined before the event starts. */
export function UpcomingEventBanner({ event }: { event: EventInfo }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now >= event.startsAt) return null;

  return (
    <div className="mb-4 space-y-3">
      <EventCountdown startsAt={event.startsAt} timezone={event.timezone} />
      {event.description ? <DescriptionNote text={event.description} /> : null}
      {event.location ? (
        <p className="flex items-start gap-2 px-1 text-sm text-muted-foreground">
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-cyan" />
          <span>{event.location}</span>
        </p>
      ) : null}
    </div>
  );
}
