export type SongStatus = "queued" | "playing" | "done";

export type SongLanguage = "cantonese" | "english" | "other";

export type Persistence = "redis" | "file" | "memory";

export type StaffRole = "host" | "cohost";

export interface QueueItem {
  id: string;
  title: string;
  artist: string;
  url?: string;
  spotifyUrl?: string;
  language?: SongLanguage;
  languageOther?: string;
  /** Note from the singer to the room. */
  message?: string;
  submittedBy: string;
  submitterId: string;
  status: SongStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  /** Set when host/cohost edits a song; shown as a Verified badge. */
  modified?: boolean;
}

export interface EventInfo {
  title: string;
  description: string;
  location: string;
  /** Unix ms when the event starts (absolute instant). */
  startsAt: number;
  /** IANA timezone the host chose for display. Defaults to Asia/Hong_Kong. */
  timezone?: string;
}

export interface Room {
  code: string;
  hostToken: string;
  /** Minted when link validation / cohost mode is turned on. */
  cohostToken?: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  queue: QueueItem[];
  event?: EventInfo;
  /** When true, host can invite a cohost device to preview links and edit songs. */
  validationEnabled?: boolean;
  /**
   * Guest song intake. Undefined/true = open. False = paused until the host
   * opens it, or until queueOpensAt if that time has passed.
   */
  queueOpen?: boolean;
  /** If set while the queue is paused, guests can add songs from this instant. */
  queueOpensAt?: number;
}

export interface PublicRoom {
  code: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  queue: QueueItem[];
  nowPlaying: QueueItem | null;
  upNext: QueueItem[];
  done: QueueItem[];
  persistence: Persistence;
  event?: EventInfo;
  validationEnabled: boolean;
  hasCohost: boolean;
  queueOpen: boolean;
  queueOpensAt?: number;
}

export interface CreateRoomResponse {
  code: string;
  hostToken: string;
  shareUrl: string;
  hostUrl: string;
  inviteUrl: string;
  persistence: Persistence;
}

export interface SongSearchHit {
  id: string;
  title: string;
  artist: string;
  url?: string;
  spotifyUrl?: string;
  language?: SongLanguage;
  languageOther?: string;
  source: string;
}

export interface ApiError {
  error: string;
}

export const ROOM_IDLE_TTL_MS = 1000 * 60 * 60 * 24;
export const MAX_SONGS_PER_ROOM = 80;
export const MAX_SONGS_PER_GUEST = 12;
export const MAX_TITLE = 80;
export const MAX_ARTIST = 80;
export const MAX_NAME = 24;
/** Encoded YouTube/Spotify search URLs for long CJK titles need more than 300. */
export const MAX_URL = 2000;
export const MAX_EVENT_TITLE = 80;
export const MAX_EVENT_DESCRIPTION = 400;
export const MAX_EVENT_LOCATION = 120;
export const MAX_LANGUAGE_OTHER = 40;
export const MAX_MESSAGE = 160;

export const SONG_LANGUAGE_LABELS: Record<SongLanguage, string> = {
  cantonese: "Cantonese",
  english: "English",
  other: "Other",
};
