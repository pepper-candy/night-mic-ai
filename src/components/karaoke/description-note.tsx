export function DescriptionNote({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-[#1a0820]">
      <svg
        viewBox="0 0 360 160"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="descGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff2f92" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#18e7ff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffd24a" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect width="360" height="160" fill="url(#descGlow)" />
        <path
          d="M24 38h312"
          stroke="#ffd24a"
          strokeOpacity="0.18"
          strokeWidth="1"
        />
        <path
          d="M24 58h312"
          stroke="#18e7ff"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
        <path
          d="M24 78h312"
          stroke="#ffd24a"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
        <path
          d="M24 98h312"
          stroke="#18e7ff"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        <path
          d="M24 118h312"
          stroke="#ffd24a"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
        <g fill="#ffd24a">
          <circle cx="42" cy="44" r="5" />
          <rect x="45" y="18" width="3" height="26" rx="1" />
          <path d="M48 18c10 2 18 8 18 16" fill="none" stroke="#ffd24a" strokeWidth="2" />
        </g>
        <g fill="#18e7ff">
          <circle cx="318" cy="112" r="4.5" />
          <rect x="320.5" y="90" width="2.5" height="22" rx="1" />
          <path d="M323 90c8 2 14 6 14 13" fill="none" stroke="#18e7ff" strokeWidth="2" />
        </g>
        <path
          d="M168 22c2 8-4 12-4 18 4-2 10 0 12 6"
          fill="none"
          stroke="#ff2f92"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="relative px-5 py-6">
        <p className="font-display text-xl leading-snug tracking-wide text-gold/90 sm:text-2xl">
          {text}
        </p>
      </div>
    </div>
  );
}
