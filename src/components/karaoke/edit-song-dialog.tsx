"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { songAction } from "@/lib/api-client";
import { MAX_URL, type PublicRoom, type QueueItem, type SongLanguage } from "@/lib/types";

function EditSongForm({
  code,
  song,
  onSaved,
  onClose,
}: {
  code: string;
  song: QueueItem;
  onSaved: (room: PublicRoom) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist);
  const [url, setUrl] = useState(song.url ?? "");
  const [spotifyUrl, setSpotifyUrl] = useState(song.spotifyUrl ?? "");
  const [language, setLanguage] = useState<SongLanguage>(song.language || "english");
  const [languageOther, setLanguageOther] = useState(song.languageOther ?? "");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          setPending(true);
          try {
            const room = await songAction(code, song.id, "edit", {
              title,
              artist,
              url,
              spotifyUrl,
              language,
              languageOther: language === "other" ? languageOther : undefined,
            });
            onSaved(room);
            onClose();
            toast.success("Song updated (modified).");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not edit that song.");
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11"
          maxLength={80}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-artist">Artist</Label>
        <Input
          id="edit-artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="h-11"
          maxLength={80}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-language">Language</Label>
        <select
          id="edit-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as SongLanguage)}
          className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base dark:bg-input/30"
        >
          <option value="cantonese">Cantonese</option>
          <option value="english">English</option>
          <option value="other">Other languages</option>
        </select>
      </div>
      {language === "other" ? (
        <div className="space-y-1.5">
          <Label htmlFor="edit-language-other">Please specify</Label>
          <Input
            id="edit-language-other"
            value={languageOther}
            onChange={(e) => setLanguageOther(e.target.value)}
            className="h-11"
            maxLength={40}
            required
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="edit-url">YouTube / karaoke link</Label>
        <Input
          id="edit-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-11"
          maxLength={MAX_URL}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-spotify">Spotify link</Label>
        <Input
          id="edit-spotify"
          type="url"
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          className="h-11"
          maxLength={MAX_URL}
        />
      </div>
      <Button type="submit" disabled={pending} className="h-12 w-full neon-button">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function EditSongDialog({
  code,
  song,
  open,
  onOpenChange,
  onSaved,
}: {
  code: string;
  song: QueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (room: PublicRoom) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Edit queued song</DialogTitle>
          <DialogDescription>
            Host and cohost edits mark the card as (modified) under the requester&apos;s name.
          </DialogDescription>
        </DialogHeader>
        {song && open ? (
          <EditSongForm
            key={song.id}
            code={code}
            song={song}
            onSaved={onSaved}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
