import { sanitizeEventDescription } from "@/lib/validation";

function EighthNote({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {/* Material music_note — solid ♪ glyph */}
      <path
        fill="currentColor"
        d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
      />
    </svg>
  );
}

function BeamedNotes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {/* Heroicons musical-note — solid ♫-style pair */}
      <path
        fill="currentColor"
        d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.206 2.885 2.25 2.25 0 1 1-1.769-4.168 1.5 1.5 0 0 0 1-1.387V7.348l-8 1.83v9.125a3 3 0 0 1-2.206 2.885 2.25 2.25 0 1 1-1.769-4.168 1.5 1.5 0 0 0 1-1.387V6.275a.75.75 0 0 1 .544-.724l10-2.286a.75.75 0 0 1 .658.086Z"
      />
    </svg>
  );
}

/** Single-line invite brief with dim decorative note glyphs inside the pill. */
export function DescriptionNote({ text }: { text: string }) {
  const line = sanitizeEventDescription(text);
  if (!line) return null;

  return (
    <div className="relative flex min-h-14 items-center overflow-hidden rounded-2xl border border-gold/20 bg-[#1a0820] px-3 py-3">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <EighthNote className="absolute top-1/2 left-2 size-5 -translate-y-1/2 text-gold/20" />
        <BeamedNotes className="absolute top-1/2 right-14 size-5 -translate-y-1/2 text-cyan/15" />
        <EighthNote className="absolute top-1/2 right-2.5 size-5 -translate-y-1/2 text-gold/25" />
      </div>
      <p
        title={line}
        className="relative min-w-0 flex-1 truncate px-7 text-center font-display text-base leading-7 tracking-wide text-gold/90"
      >
        {line}
      </p>
    </div>
  );
}
