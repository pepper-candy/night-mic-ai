"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveDisplayName, useDisplayName } from "@/hooks/use-identity";
import { fetchRoom } from "@/lib/api-client";
import { formatCode, normalizeCode } from "@/lib/codes";

export function JoinForm({
  initialCode = "",
  compact = false,
}: {
  initialCode?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const storedName = useDisplayName();
  const [code, setCode] = useState(initialCode);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const name = draftName ?? storedName;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeCode(code);
    if (!normalized) {
      toast.error("Enter the room code they shouted.");
      return;
    }
    if (!name.trim()) {
      toast.error("Pick a display name first.");
      return;
    }
    setPending(true);
    try {
      await fetchRoom(normalized);
      saveDisplayName(name);
      router.push(`/room/${normalized}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join that room.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {!compact ? (
        <div>
          <p className="font-display text-3xl tracking-wide">Jump in</p>
          <p className="text-sm text-muted-foreground">
            {initialCode
              ? `You're heading to ${formatCode(normalizeCode(initialCode))}. Tell the room who you are.`
              : "Type the room code and a name people will see on the queue."}
          </p>
        </div>
      ) : null}
      {!initialCode ? (
        <div className="space-y-1.5">
          <Label htmlFor="join-code">Room code</Label>
          <Input
            id="join-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="VIBE 42"
            className="h-12 text-base tracking-[0.18em]"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            required
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="join-name">Display name</Label>
        <Input
          id="join-name"
          value={name}
          onChange={(event) => setDraftName(event.target.value)}
          placeholder="Sam"
          className="h-12 text-base"
          maxLength={24}
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="h-12 w-full text-base neon-button">
        {pending ? "Finding the room…" : "Join the queue"}
      </Button>
    </form>
  );
}
