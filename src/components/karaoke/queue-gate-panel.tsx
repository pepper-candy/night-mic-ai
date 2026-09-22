"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setQueueGate } from "@/lib/api-client";
import {
  formatEventWhen,
  resolveEventTimezone,
  toDatetimeLocalInZone,
} from "@/lib/event-time";
import { isQueueAccepting } from "@/lib/queue-gate";
import type { PublicRoom } from "@/lib/types";

export function QueueGatePanel({
  code,
  room,
  onUpdated,
}: {
  code: string;
  room: PublicRoom;
  onUpdated: (room: PublicRoom) => void;
}) {
  const timezone = resolveEventTimezone(room.event?.timezone);
  const accepting = isQueueAccepting(room);
  const [opensAt, setOpensAt] = useState(
    room.queueOpensAt ? toDatetimeLocalInZone(room.queueOpensAt, timezone) : "",
  );
  const [pending, setPending] = useState(false);

  async function save(open: boolean, scheduled: boolean) {
    setPending(true);
    try {
      const next = await setQueueGate(code, {
        open,
        opensAt: scheduled && !open ? opensAt : undefined,
        timezone,
      });
      onUpdated(next);
      toast.success(open ? "Guests can add songs." : scheduled ? "Queue will open at that time." : "New songs are paused.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the queue gate.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glow-panel space-y-3 p-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan">Queue</p>
        <h2 className="font-display text-2xl tracking-wide">When guests can add songs</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {accepting
            ? "The queue is open."
            : room.queueOpensAt
              ? `Paused until ${formatEventWhen(room.queueOpensAt, timezone)}.`
              : "Paused. Guests can’t add songs until you open it."}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          disabled={pending}
          className="h-12 flex-1 neon-button"
          onClick={() => void save(true, false)}
        >
          Open now
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="h-12 flex-1"
          onClick={() => void save(false, false)}
        >
          Pause
        </Button>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="queue-opens">Or open automatically at</Label>
        <Input
          id="queue-opens"
          type="datetime-local"
          value={opensAt}
          onChange={(event) => setOpensAt(event.target.value)}
          className="h-12 text-base"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !opensAt}
          className="h-11 w-full"
          onClick={() => void save(false, true)}
        >
          Schedule open
        </Button>
      </div>
    </section>
  );
}
