"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchSongs, submitSong } from "@/lib/api-client";
import { getGuestId, getRoomNickname } from "@/lib/identity";
import { assignMediaLink, spotifyCatalogSearchUrl } from "@/lib/media";
import {
  MAX_MESSAGE,
  MAX_URL,
  SONG_LANGUAGE_LABELS,
  type PublicRoom,
  type SongLanguage,
  type SongSearchHit,
} from "@/lib/types";
import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";

const LANGUAGE_OPTIONS: Array<{ value: SongLanguage; label: string }> = [
  { value: "cantonese", label: "Cantonese" },
  { value: "english", label: "English" },
  { value: "other", label: "Other languages" },
];

export function AddSongForm({
  code,
  onAdded,
  asName,
  locked = false,
  lockedMessage,
}: {
  code: string;
  onAdded: (room: PublicRoom) => void;
  /** Host/cohost songs can skip the guest nickname. */
  asName?: string;
  locked?: boolean;
  lockedMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [link, setLink] = useState("");
  const [language, setLanguage] = useState<SongLanguage | "">("");
  const [languageOther, setLanguageOther] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SongSearchHit[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const blurTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (blurTimer.current) window.clearTimeout(blurTimer.current);
    };
  }, []);

  function scheduleSuggest(nextTitle: string) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (nextTitle.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      void runSearch(nextTitle, false);
    }, 320);
  }

  async function runSearch(query: string, announce: boolean) {
    const q = query.trim();
    if (q.length < 2) {
      toast.error("Type at least 2 characters to search.");
      return;
    }
    setSearching(true);
    try {
      const results = await searchSongs(q);
      setSuggestions(results);
      setShowSuggestions(true);
      if (announce) {
        if (results.length === 0) toast.message("No matches. You can still type it in.");
        else toast.success(`Found ${results.length} match${results.length === 1 ? "" : "es"}.`);
      }
    } catch (error) {
      if (announce) {
        toast.error(error instanceof Error ? error.message : "Search failed.");
      }
    } finally {
      setSearching(false);
    }
  }

  function applyHit(hit: SongSearchHit) {
    setTitle(hit.title);
    setArtist(hit.artist);
    if (hit.language) {
      setLanguage(hit.language);
      setLanguageOther(hit.language === "other" ? hit.languageOther ?? "" : "");
    }
    setShowSuggestions(false);
  }

  function hitLanguageLabel(hit: SongSearchHit): string | undefined {
    if (!hit.language) return undefined;
    if (hit.language === "other") return hit.languageOther?.trim() || "Other";
    return SONG_LANGUAGE_LABELS[hit.language];
  }

  function findSongLink() {
    const qTitle = title.trim();
    if (!qTitle) {
      toast.error("Type a song title first.");
      return;
    }
    window.open(spotifyCatalogSearchUrl(qTitle, artist), "_blank", "noreferrer");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (locked) return;
    const displayName = (asName ?? getRoomNickname(code)).trim();
    if (!displayName) {
      toast.error("Pick a nickname before adding a song.");
      return;
    }
    if (language === "other" && !languageOther.trim()) {
      toast.error("Say which language.");
      return;
    }
    const media = assignMediaLink(link);
    setPending(true);
    try {
      const room = await submitSong(code, {
        title,
        artist,
        url: media.url,
        spotifyUrl: media.spotifyUrl,
        language: language || undefined,
        languageOther: language === "other" ? languageOther : undefined,
        message: message.trim() || undefined,
        displayName,
        guestId: getGuestId(),
      });
      onAdded(room);
      setTitle("");
      setArtist("");
      setLink("");
      setLanguage("");
      setLanguageOther("");
      setMessage("");
      setSuggestions([]);
      setMoreOpen(false);
      setOpen(false);
      toast.success("You're on the list.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add that song.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="glow-panel overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div>
          <p className="font-display text-2xl tracking-wide">Throw a song on</p>
          <p className="text-sm text-muted-foreground">Give us your favourite song!</p>
          {!open ? (
            <p className="mt-1 text-xs text-cyan">Tap to add yours</p>
          ) : null}
        </div>
        <ChevronDownIcon
          className={`size-6 shrink-0 text-gold transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className={`space-y-3 border-t border-border px-4 pb-4 pt-3 ${locked ? "opacity-40" : ""}`}>
          {locked ? (
            <p className="text-sm text-gold">{lockedMessage || "The host hasn't opened the queue yet."}</p>
          ) : null}
          <fieldset disabled={locked} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="song-title">Song title</Label>
              <div className="relative">
                <Input
                  id="song-title"
                  value={title}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTitle(value);
                    scheduleSuggest(value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    blurTimer.current = window.setTimeout(() => setShowSuggestions(false), 180);
                  }}
                  placeholder="Don't Stop Believin'"
                  className="h-12 pr-12 text-base"
                  maxLength={80}
                  required
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 size-10 -translate-y-1/2"
                  aria-label="Search songs"
                  disabled={searching}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void runSearch(title, true)}
                >
                  {searching ? (
                    <span className="text-xs text-muted-foreground">…</span>
                  ) : (
                    <SearchIcon className="size-5 text-cyan" />
                  )}
                </Button>
                {showSuggestions && suggestions.length > 0 ? (
                  <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-lg">
                    {suggestions.map((hit) => {
                      const languageGuess = hitLanguageLabel(hit);
                      return (
                        <li key={hit.id}>
                          <button
                            type="button"
                            className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-secondary"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyHit(hit)}
                          >
                            <span className="text-sm font-medium">{hit.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {hit.artist}
                              {languageGuess ? ` · ${languageGuess}` : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
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
                autoComplete="off"
              />
            </div>

            <Button type="button" variant="outline" className="h-12 w-full" onClick={findSongLink}>
              Find song link
            </Button>

            <div className="space-y-1.5">
              <Label htmlFor="song-link">Link?</Label>
              <div className="relative">
                <Input
                  id="song-link"
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://open.spotify.com/…"
                  className="h-12 pr-10 text-base"
                  maxLength={MAX_URL}
                  autoComplete="off"
                />
                {link ? (
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                    aria-label="Clear link"
                    onClick={() => setLink("")}
                  >
                    <XIcon className="size-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg py-1 text-sm text-muted-foreground"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
            >
              <span>More</span>
              <ChevronDownIcon
                className={`size-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
              />
            </button>

            {moreOpen ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="song-language">Song language</Label>
                  <select
                    id="song-language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as SongLanguage | "")}
                    className="h-12 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value=""> </option>
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {language === "other" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="song-language-other">Please specify</Label>
                    <Input
                      id="song-language-other"
                      value={languageOther}
                      onChange={(event) => setLanguageOther(event.target.value)}
                      placeholder="Mandarin, Japanese, Korean…"
                      className="h-12 text-base"
                      maxLength={40}
                      autoComplete="off"
                    />
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="song-message">Message to Audience</Label>
                  <textarea
                    id="song-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Dedicate it, hype it, or say hi…"
                    className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    maxLength={MAX_MESSAGE}
                  />
                </div>
              </div>
            ) : null}

            <Button type="submit" disabled={pending || locked} className="h-12 w-full text-base neon-button">
              {pending ? "Queuing…" : "Add to queue"}
            </Button>
          </fieldset>
        </div>
      ) : null}
    </form>
  );
}
