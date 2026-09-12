"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitSong } from "@/lib/api-client";
import { getDisplayName, getGuestId } from "@/lib/identity";
import type { PublicRoom } from "@/lib/types";

export function AddSongForm({
  code,
  onAdded,
}: {
  code: string;
  onAdded: (room: PublicRoom) => void;
}) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const room = await submitSong(code, {
        title,
        artist,
        url,
        displayName: getDisplayName() || "Mystery singer",
        guestId: getGuestId(),
      });
      onAdded(room);
      setTitle("");
      setArtist("");
      setUrl("");
      toast.success("You're on the list.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add that song.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glow-panel space-y-3 p-4">
      <div>
        <p className="font-display text-2xl tracking-wide">Throw a song on</p>
        <p className="text-sm text-muted-foreground">
          Title and artist are enough. A karaoke or YouTube link is optional.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="song-title">Song title</Label>
        <Input
          id="song-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Don't Stop Believin'"
          className="h-12 text-base"
          maxLength={80}
          required
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="song-artist">Artist</Label>
        <Input
          id="song-artist"
          value={artist}
          onChange={(event) => setArtist(event.target.value)}
          placeholder="Journey"
          className="h-12 text-base"
          maxLength={80}
          required
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="song-url">Karaoke / YouTube link (optional)</Label>
        <Input
          id="song-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://"
          className="h-12 text-base"
          maxLength={300}
          autoComplete="off"
        />
      </div>
      <Button type="submit" disabled={pending} className="h-12 w-full text-base neon-button">
        {pending ? "Queuing…" : "Add to queue"}
      </Button>
    </form>
  );
}
