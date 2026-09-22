"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Soft staff-line + neon glow backdrop for invite / upcoming-event surfaces.
 * Notes stay inside the brief pill — this layer is lines and light only.
 */
function MusicScoreArtwork() {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 360 240"
      className="absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMin slice"
    >
      <defs>
        <linearGradient id={`${uid}-glow`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2f92" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#18e7ff" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#ffd24a" stopOpacity="0.12" />
        </linearGradient>
        <radialGradient id={`${uid}-bloom-pink`} cx="12%" cy="0%" r="55%">
          <stop offset="0%" stopColor="#ff2f92" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ff2f92" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-bloom-cyan`} cx="100%" cy="28%" r="48%">
          <stop offset="0%" stopColor="#18e7ff" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#18e7ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-bloom-gold`} cx="50%" cy="100%" r="42%">
          <stop offset="0%" stopColor="#ffd24a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffd24a" stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`${uid}-staff`}
          width="360"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          <path d="M12 10h336" stroke="#ffd24a" strokeOpacity="0.16" strokeWidth="1" />
          <path d="M12 26h336" stroke="#18e7ff" strokeOpacity="0.11" strokeWidth="1" />
          <path d="M12 42h336" stroke="#ffd24a" strokeOpacity="0.11" strokeWidth="1" />
          <path d="M12 58h336" stroke="#18e7ff" strokeOpacity="0.09" strokeWidth="1" />
          <path d="M12 74h336" stroke="#ffd24a" strokeOpacity="0.09" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="360" height="240" fill={`url(#${uid}-glow)`} />
      <rect width="360" height="240" fill={`url(#${uid}-bloom-pink)`} />
      <rect width="360" height="240" fill={`url(#${uid}-bloom-cyan)`} />
      <rect width="360" height="240" fill={`url(#${uid}-bloom-gold)`} />
      <rect width="360" height="240" fill={`url(#${uid}-staff)`} />
    </svg>
  );
}

export function MusicScoreScope({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="music-score-atmosphere pointer-events-none absolute -inset-1 overflow-hidden rounded-3xl"
        aria-hidden
      >
        <MusicScoreArtwork />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
