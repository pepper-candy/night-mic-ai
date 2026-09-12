const WORDS = [
  "VIBE",
  "JAM",
  "GLOW",
  "NEON",
  "DISCO",
  "BEAT",
  "STAR",
  "ECHO",
  "RIFF",
  "FUNK",
  "SOUL",
  "ROCK",
  "POP",
  "MIKE",
  "SING",
  "DUET",
  "HYPE",
  "WAVE",
  "BASS",
  "DRUM",
  "GOLD",
  "PINK",
  "CYAN",
  "FIRE",
  "BOOM",
  "YEAH",
  "LOUD",
  "PARTY",
  "NOVA",
  "LUNA",
  "KICK",
  "RISE",
  "WILD",
  "FAST",
  "SLOW",
  "HIGH",
  "LOW",
  "HOT",
  "COOL",
  "ZING",
  "ZOOM",
  "BANG",
  "CLAP",
  "SHIM",
  "GLOW",
  "DARE",
  "BOLD",
  "EPIC",
  "MEGA",
  "MINI",
  "LIVE",
  "SHOW",
  "STAGE",
  "CROWD",
  "CHEER",
  "ROAR",
  "SPARK",
  "FLASH",
  "BLITZ",
  "GROOVE",
] as const;

export function generateRoomCode(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)] ?? "VIBE";
  const n = Math.floor(Math.random() * 90) + 10;
  return `${word}${n}`;
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidCode(code: string): boolean {
  return /^[A-Z]{3,8}\d{2,3}$/.test(code);
}

export function formatCode(code: string): string {
  const match = code.match(/^([A-Z]+)(\d+)$/);
  return match ? `${match[1]} ${match[2]}` : code;
}
