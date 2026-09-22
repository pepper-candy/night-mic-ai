"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setValidation } from "@/lib/api-client";
import { saveCohostToken } from "@/hooks/use-identity";
import type { PublicRoom } from "@/lib/types";
import { CheckIcon, CopyIcon, ShieldCheckIcon } from "lucide-react";

export function ValidationSettingsPanel({
  code,
  enabled,
  onUpdated,
  cohostToken,
}: {
  code: string;
  enabled: boolean;
  onUpdated: (room: PublicRoom, cohostToken?: string) => void;
  cohostToken?: string;
}) {
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState(cohostToken || "");

  async function toggle(next: boolean) {
    setPending(true);
    try {
      const result = await setValidation(code, next);
      if (result.cohostToken) {
        setToken(result.cohostToken);
        saveCohostToken(code, result.cohostToken);
      }
      onUpdated(result.room, result.cohostToken);
      toast.success(
        next
          ? "Link validation on — share the cohost link with a trusted phone."
          : "Link validation turned off.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update validation.");
    } finally {
      setPending(false);
    }
  }

  async function copyCohostLink() {
    setPending(true);
    try {
      let nextToken = token;
      if (!nextToken) {
        const result = await setValidation(code, true);
        if (result.cohostToken) {
          nextToken = result.cohostToken;
          setToken(result.cohostToken);
          saveCohostToken(code, result.cohostToken);
        }
        onUpdated(result.room, result.cohostToken);
      }
      if (!nextToken) {
        toast.error("Could not mint a cohost link. Try turning validation on again.");
        return;
      }
      const url = `${window.location.origin}/room/${code}/cohost?cohost=${nextToken}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Cohost link copied. Give it to a trusted device only.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not copy cohost link.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="glow-panel space-y-3 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-full bg-cyan/15 p-2 text-cyan">
          <ShieldCheckIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan">Public events</p>
          <h2 className="font-display text-2xl tracking-wide">Link validation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn this on and hand a cohost phone the preview link. They can open embeds,
            edit queued songs, and flag bad links before the room hears them.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-12 min-h-12 flex-1"
          variant={enabled ? "outline" : "default"}
          disabled={pending || enabled}
          onClick={() => void toggle(true)}
        >
          {enabled ? "Validation is on" : "Turn validation on"}
        </Button>
        {enabled ? (
          <Button
            className="h-12 min-h-12 flex-1"
            variant="outline"
            disabled={pending}
            onClick={() => void toggle(false)}
          >
            Turn off
          </Button>
        ) : null}
      </div>

      {enabled ? (
        <Button variant="ghost" className="h-12 min-h-12 w-full" onClick={() => void copyCohostLink()}>
          {copied ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          Copy cohost preview link
        </Button>
      ) : null}
    </section>
  );
}
