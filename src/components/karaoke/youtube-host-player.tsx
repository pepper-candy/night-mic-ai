"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type YoutubeHostPlayerHandle = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
};

type YtPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  cueVideoById: (id: string) => void;
  loadVideoById: (id: string) => void;
  getPlayerState: () => number;
  getVideoData?: () => { video_id?: string };
  destroy: () => void;
};

type YtNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YtPlayer }) => void;
        onStateChange?: (event: { data: number; target: YtPlayer }) => void;
      };
    },
  ) => YtPlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
  };
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YtNamespace> | null = null;

function loadYoutubeIframeApi(): Promise<YtNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube player is browser-only."));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube IFrame API did not load."));
    };
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => reject(new Error("Could not load the YouTube IFrame API."));
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
}

export const YoutubeHostPlayer = forwardRef<
  YoutubeHostPlayerHandle,
  {
    videoId: string;
    onEnded?: () => void;
    onPlayingChange?: (playing: boolean) => void;
  }
>(function YoutubeHostPlayer({ videoId, onEnded, onPlayingChange }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const videoIdRef = useRef(videoId);
  const endedForRef = useRef<string | null>(null);
  const firstCueRef = useRef(true);
  const onEndedRef = useRef(onEnded);
  const onPlayingChangeRef = useRef(onPlayingChange);

  videoIdRef.current = videoId;
  onEndedRef.current = onEnded;
  onPlayingChangeRef.current = onPlayingChange;

  useImperativeHandle(ref, () => ({
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    toggle: () => {
      const player = playerRef.current;
      const YT = window.YT;
      if (!player || !YT) return;
      if (player.getPlayerState() === YT.PlayerState.PLAYING) player.pauseVideo();
      else player.playVideo();
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let player: YtPlayer | null = null;

    void loadYoutubeIframeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        hostRef.current.replaceChildren();
        const mount = document.createElement("div");
        mount.className = "h-full w-full";
        hostRef.current.appendChild(mount);

        player = new YT.Player(mount, {
          videoId: videoIdRef.current,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              firstCueRef.current = false;
              onPlayingChangeRef.current?.(false);
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.PLAYING) {
                onPlayingChangeRef.current?.(true);
              } else if (event.data === YT.PlayerState.PAUSED) {
                onPlayingChangeRef.current?.(false);
              } else if (event.data === YT.PlayerState.ENDED) {
                onPlayingChangeRef.current?.(false);
                const endedId = event.target.getVideoData?.()?.video_id;
                const id = videoIdRef.current;
                if (endedId && endedId !== id) return;
                if (endedForRef.current === id) return;
                endedForRef.current = id;
                onEndedRef.current?.();
              }
            },
          },
        });
        playerRef.current = player;
      })
      .catch(() => {
        onPlayingChangeRef.current?.(false);
      });

    return () => {
      cancelled = true;
      playerRef.current = null;
      try {
        player?.destroy();
      } catch {
        // Player may already be gone with the node.
      }
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (firstCueRef.current) {
      player.cueVideoById(videoId);
      firstCueRef.current = false;
      return;
    }
    endedForRef.current = null;
    player.loadVideoById(videoId);
  }, [videoId]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black">
      <div ref={hostRef} className="aspect-video w-full" />
    </div>
  );
});
