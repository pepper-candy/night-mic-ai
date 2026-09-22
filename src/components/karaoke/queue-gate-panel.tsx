"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DateTimeLocalInput } from "@/components/karaoke/datetime-local-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setQueueGate } from "@/lib/api-client";
import {
  formatDatetimeLocalValue,
  resolveEventTimezone,
  toDatetimeLocalInZone,
} from "@/lib/event-time";
import { isQueueAccepting } from "@/lib/queue-gate";
import type { PublicRoom } from "@/lib/types";
import { CheckIcon } from "lucide-react";

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
  const opensAtLabel = formatDatetimeLocalValue(opensAt);

  async function save(open: boolean, scheduled: boolean) {
    setPending(true);
    try {
      const next = await setQueueGate(code, {
        open,
        opensAt: scheduled && !open ? opensAt : undefined,
        timezone,
      });
      onUpdated(next);
      toast.success(open ? "LIVE" : scheduled ? "Opens after that date." : "Paused");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the queue.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glow-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl tracking-wide">When guests can add songs</h2>
        {accepting ? (
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">
            LIVE
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-secondary text-muted-foreground">
            OFF
          </Badge>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        <Button
          type="button"
          disabled={pending}
          variant={accepting ? "outline" : "default"}
          className={`h-12 min-h-12 w-full px-5 sm:w-auto ${accepting ? "" : "neon-button"}`}
          onClick={() => void save(!accepting, false)}
        >
          {pending ? "…" : accepting ? "Pause" : "On"}
        </Button>

        <div className="min-w-0 space-y-1.5 rounded-lg border border-input bg-transparent px-3 py-2 dark:bg-input/30">
          <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <span className="text-xs text-muted-foreground">After this date</span>
            {opensAtLabel ? (
              <span className="min-w-0 text-sm font-medium text-foreground">{opensAtLabel}</span>
            ) : (
              <span className="text-sm text-muted-foreground">Pick a date & time</span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-1">
            <DateTimeLocalInput
              id="queue-opens"
              value={opensAt}
              onChange={(event) => setOpensAt(event.target.value)}
              aria-label="After this date"
              className="h-12 min-h-12 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-12 min-h-12 min-w-12 shrink-0"
              disabled={pending || !opensAt}
              aria-label="Update open date"
              onClick={() => void save(false, true)}
            >
              <CheckIcon className="size-5 text-emerald-400" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
