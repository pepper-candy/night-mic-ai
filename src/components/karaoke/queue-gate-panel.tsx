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
      toast.success(
        open
          ? "Queue is open — guests can add songs."
          : scheduled
            ? "Queue is paused until that time."
            : "Queue is paused — guests cannot add songs.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the queue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glow-panel space-y-3 p-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan">Queue</p>
        <h2 className="font-display text-2xl tracking-wide">When guests can add songs</h2>
      </div>

      <div
        className={`rounded-xl px-4 py-3 ${
          accepting
            ? "border border-emerald-400/40 bg-emerald-500/15"
            : "border border-gold/40 bg-gold/10"
        }`}
      >
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${
            accepting ? "text-emerald-400" : "text-gold"
          }`}
        >
          {accepting ? "Open" : "Paused"}
        </p>
        <p className="mt-1 text-sm text-foreground">
          {accepting
            ? "Guests can add songs right now. (This is the default.)"
            : room.queueOpensAt
              ? `Guests cannot add songs until ${formatEventWhen(room.queueOpensAt, timezone)}.`
              : "Guests cannot add songs until you open the queue."}
        </p>
      </div>

      <Button
        type="button"
        disabled={pending}
        className={`h-12 w-full ${accepting ? "" : "neon-button"}`}
        variant={accepting ? "outline" : "default"}
        onClick={() => void save(!accepting, false)}
      >
        {pending ? "Saving…" : accepting ? "Pause queue" : "Open queue"}
      </Button>

      <div className="space-y-1.5">
        <Label htmlFor="queue-opens">Or pause until this time</Label>
        <Input
          id="queue-opens"
          type="datetime-local"
          value={opensAt}
          onChange={(event) => setOpensAt(event.target.value)}
          className="h-12 text-base"
        />
        <Button
          type="button"
          variant="ghost"
          disabled={pending || !opensAt}
          className="h-11 w-full"
          onClick={() => void save(false, true)}
        >
          Pause until then
        </Button>
      </div>
    </section>
  );
}
