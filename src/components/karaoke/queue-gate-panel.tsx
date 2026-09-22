"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DateTimeLocalInput } from "@/components/karaoke/datetime-local-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setQueueGate } from "@/lib/api-client";
import { resolveEventTimezone, toDatetimeLocalInZone } from "@/lib/event-time";
import { isQueueAccepting } from "@/lib/queue-gate";
import type { PublicRoom } from "@/lib/types";
import { CheckIcon, PauseIcon, PlayIcon } from "lucide-react";

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
            CLOSED
          </Badge>
        )}
      </div>

      <div className="flex h-12 min-h-12 items-stretch gap-2">
        <Button
          type="button"
          size="icon"
          disabled={pending}
          variant={accepting ? "outline" : "default"}
          className={`size-12 min-h-12 min-w-12 shrink-0 ${accepting ? "" : "neon-button"}`}
          aria-label={accepting ? "Pause guest song additions" : "Allow guest song additions"}
          onClick={() => void save(!accepting, false)}
        >
          {accepting ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
        </Button>

        <div className="flex h-12 min-h-12 min-w-0 flex-1 items-center rounded-lg border border-input bg-transparent dark:bg-input/30">
          <DateTimeLocalInput
            id="queue-opens"
            value={opensAt}
            onChange={(event) => setOpensAt(event.target.value)}
            aria-label="or After this Date"
            emptyLabel="or After this Date"
            className="h-12 min-h-12 border-0 bg-transparent px-1 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
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
    </section>
  );
}
