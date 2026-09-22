"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEvent } from "@/lib/api-client";
import {
  EVENT_TIMEZONES,
  formatEventWhen,
  resolveEventTimezone,
  toDatetimeLocalInZone,
} from "@/lib/event-time";
import type { EventInfo, PublicRoom } from "@/lib/types";

function EventForm({
  code,
  event,
  onUpdated,
  onBusy,
}: {
  code: string;
  event?: EventInfo;
  onUpdated: (room: PublicRoom) => void;
  onBusy: (pending: boolean) => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [timezone, setTimezone] = useState(resolveEventTimezone(event?.timezone));
  const [startsAt, setStartsAt] = useState(
    event ? toDatetimeLocalInZone(event.startsAt, resolveEventTimezone(event.timezone)) : "",
  );
  const [pending, setPending] = useState(false);

  async function onSave(eventSubmit: React.FormEvent) {
    eventSubmit.preventDefault();
    setPending(true);
    onBusy(true);
    try {
      const room = await updateEvent(code, {
        title,
        description,
        location,
        startsAt,
        timezone,
      });
      onUpdated(room);
      toast.success("Invitation details saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save event details.");
    } finally {
      setPending(false);
      onBusy(false);
    }
  }

  async function onClear() {
    setPending(true);
    onBusy(true);
    try {
      const room = await updateEvent(code, {
        title: "",
        description: "",
        location: "",
        startsAt: "",
        clear: true,
      });
      onUpdated(room);
      toast.success("Invitation cleared.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clear event.");
    } finally {
      setPending(false);
      onBusy(false);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="event-title">Event title</Label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Society karaoke night"
          className="h-12 text-base"
          maxLength={80}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event-description">Brief description</Label>
        <textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Bring your voice. Local + international tracks welcome."
          className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 md:text-sm"
          maxLength={400}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event-location">Location</Label>
        <Input
          id="event-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Clubhouse / Zoom / rooftop"
          className="h-12 text-base"
          maxLength={120}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event-timezone">Timezone</Label>
        <select
          id="event-timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="h-12 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {EVENT_TIMEZONES.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Default is Hong Kong (HKT, UTC+8). Start time is wall-clock in this zone.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event-starts">Start date & time</Label>
        <Input
          id="event-starts"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="h-12 text-base"
          required
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={pending} className="h-12 flex-1 neon-button">
          {pending ? "Saving…" : "Save invitation"}
        </Button>
        {event ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="h-12 flex-1"
            onClick={() => void onClear()}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function EventSettingsPanel({
  code,
  event,
  onUpdated,
}: {
  code: string;
  event?: EventInfo;
  onUpdated: (room: PublicRoom) => void;
}) {
  const [open, setOpen] = useState(Boolean(event));
  const [, setBusy] = useState(false);
  const formKey = event
    ? `${event.title}-${event.startsAt}-${event.location}-${event.timezone ?? ""}`
    : "new-event";

  return (
    <section className="glow-panel space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Invitation</p>
          <h2 className="font-display text-2xl tracking-wide">Event countdown</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Guests open the invite link and see a live countdown plus basic event info.
          </p>
        </div>
        <Button variant="outline" className="h-10 shrink-0" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Set up"}
        </Button>
      </div>

      {event && !open ? (
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">{event.title}</span>
          {" · "}
          {formatEventWhen(event.startsAt, event.timezone)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      ) : null}

      {open ? (
        <EventForm
          key={formKey}
          code={code}
          event={event}
          onUpdated={onUpdated}
          onBusy={setBusy}
        />
      ) : null}
    </section>
  );
}
