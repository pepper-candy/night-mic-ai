"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { searchYoutube } from "@/lib/api-client";
import { youtubeKaraokeQuery, youtubeKaraokeSearchUrl } from "@/lib/media";
import type { YoutubeSearchHit } from "@/lib/types";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

export function YoutubeSearchPicker({
  title,
  artist,
  onPick,
  onFindSpotify,
}: {
  title: string;
  artist: string;
  onPick: (url: string) => void;
  onFindSpotify?: () => void;
}) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<YoutubeSearchHit[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [finds, setFinds] = useState(0);

  const current = results[index];

  function openYoutubeResults() {
    window.open(youtubeKaraokeSearchUrl(title, artist), "_blank", "noreferrer");
    toast.message("Pick a video on YouTube, then paste the link below.");
  }

  async function findLink() {
    const q = youtubeKaraokeQuery(title, artist);
    if (q.replace(/\bkaraoke\b/i, "").trim().length < 2) {
      toast.error("Type a song title or artist first.");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const hits = await searchYoutube(q);
      setResults(hits);
      setIndex(0);
      setFinds((n) => n + 1);
      if (hits.length === 0) {
        setError("No YouTube matches. Paste a watch URL below, or try different title/artist.");
      }
    } catch {
      setResults([]);
      setIndex(0);
      setError(null);
      openYoutubeResults();
    } finally {
      setSearching(false);
    }
  }

  function useThis() {
    if (!current) return;
    onPick(current.url);
    setResults([]);
    setIndex(0);
    setError(null);
    toast.success("YouTube link filled.");
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-12 min-h-12 w-full"
        disabled={searching}
        onClick={() => void findLink()}
      >
        <SearchIcon data-icon="inline-start" />
        {searching ? "Finding link…" : finds > 0 ? "Find link again" : "Find link"}
      </Button>
      {onFindSpotify ? (
        <button
          type="button"
          className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={onFindSpotify}
        >
          Or find on Spotify
        </button>
      ) : null}

      {error ? <p className="text-sm text-gold">{error}</p> : null}

      {current ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan">
              Candidate {index + 1} of {results.length}
            </p>
            {current.duration ? (
              <p className="text-xs text-muted-foreground">{current.duration}</p>
            ) : null}
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.thumbnailUrl}
            alt=""
            width={320}
            height={180}
            className="aspect-video w-full rounded-lg object-cover"
          />

          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug">{current.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {current.channel}
              {current.duration ? ` · ${current.duration}` : ""}
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-black">
            <iframe
              key={current.videoId}
              title="YouTube candidate preview"
              src={`https://www.youtube.com/embed/${current.videoId}?rel=0`}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 min-h-12 flex-1"
              disabled={index === 0}
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              Back
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 min-h-12 flex-1"
              disabled={index >= results.length - 1}
              onClick={() => setIndex((value) => Math.min(results.length - 1, value + 1))}
            >
              Next
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>

          <Button type="button" className="h-12 min-h-12 w-full neon-button" onClick={useThis}>
            <CheckIcon data-icon="inline-start" />
            Yes / use this
          </Button>

          {index >= results.length - 1 ? (
            <p className="text-xs text-muted-foreground">
              None of these? Paste a YouTube URL below, or tap Find link again.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not this one? Next, or paste a URL below.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
