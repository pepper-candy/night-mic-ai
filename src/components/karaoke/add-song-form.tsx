"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchSongs, submitSong } from "@/lib/api-client";
import { getDisplayName, getGuestId } from "@/lib/identity";
import type { PublicRoom, SongLanguage, SongSearchCatalogs, SongSearchHit } from "@/lib/types";
import { SearchIcon, XIcon } from "lucide-react";

const LANGUAGE_OPTIONS: Array<{ value: SongLanguage; label: string }> = [
  { value: "cantonese", label: "Cantonese" },
  { value: "english", label: "English" },
  { value: "other", label: "Other languages" },
];

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
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [language, setLanguage] = useState<SongLanguage | "">("");
  const [languageOther, setLanguageOther] = useState("");
  const [pending, setPending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SongSearchHit[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [catalogs, setCatalogs] = useState<SongSearchCatalogs | null>(null);
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
      const data = await searchSongs(q);
      setSuggestions(data.results);
      setCatalogs(data.catalogs);
      setShowSuggestions(true);
      if (announce) {
        if (data.results.length === 0) toast.message("No matches. You can still type it in.");
        else toast.success(`Found ${data.results.length} match${data.results.length === 1 ? "" : "es"}.`);
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
    if (hit.url) setUrl(hit.url);
    if (hit.spotifyUrl) setSpotifyUrl(hit.spotifyUrl);
    setShowSuggestions(false);
    toast.success("Filled from search — tweak if needed.");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!language) {
      toast.error("Pick a song language category.");
      return;
    }
    setPending(true);
    try {
      const room = await submitSong(code, {
        title,
        artist,
        url,
        spotifyUrl,
        language,
        languageOther: language === "other" ? languageOther : undefined,
        displayName: getDisplayName() || "Mystery singer",
        guestId: getGuestId(),
      });
      onAdded(room);
      setTitle("");
      setArtist("");
      setUrl("");
      setSpotifyUrl("");
      setLanguage("");
      setLanguageOther("");
      setSuggestions([]);
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
          Search as you type, or tap the magnifier. Pick a language so the room stays mixed.
          Choosing a result fills title, artist, and YouTube / Spotify links.
        </p>
        {catalogs ? (
          <p className="text-xs text-muted-foreground">
            {catalogs.youtube
              ? "YouTube: exact karaoke video on the top hit."
              : "YouTube: karaoke search page (add YOUTUBE_API_KEY for a specific video)."}{" "}
            {catalogs.spotify
              ? "Spotify: exact track link."
              : "Spotify: search page (add SPOTIFY_CLIENT_ID + SECRET for a specific track)."}
          </p>
        ) : null}
      </div>

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
              {suggestions.map((hit) => (
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
                      <span className="text-muted-foreground/70"> · {hit.source}</span>
                    </span>
                  </button>
                </li>
              ))}
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
          required
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="song-language">Song language</Label>
        <select
          id="song-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as SongLanguage | "")}
          className="h-12 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          required
        >
          <option value="" disabled>
            Choose category…
          </option>
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
            required
            autoComplete="off"
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="song-url">YouTube / karaoke link (optional)</Label>
        <Input
          id="song-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://"
          className="h-12 text-base"
          maxLength={800}
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="song-spotify">Spotify link (optional)</Label>
        <div className="relative">
          <Input
            id="song-spotify"
            type="url"
            value={spotifyUrl}
            onChange={(event) => setSpotifyUrl(event.target.value)}
            placeholder="https://open.spotify.com/…"
            className="h-12 pr-10 text-base"
            maxLength={800}
            autoComplete="off"
          />
          {spotifyUrl ? (
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
              aria-label="Clear Spotify link"
              onClick={() => setSpotifyUrl("")}
            >
              <XIcon className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      <Button type="submit" disabled={pending} className="h-12 w-full text-base neon-button">
        {pending ? "Queuing…" : "Add to queue"}
      </Button>
    </form>
  );
}
