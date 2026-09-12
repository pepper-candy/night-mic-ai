export type SongStatus = "queued" | "playing" | "done";

export type Persistence = "redis" | "file" | "memory";

export interface QueueItem {
  id: string;
  title: string;
  artist: string;
  url?: string;
  submittedBy: string;
  submitterId: string;
  status: SongStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface Room {
  code: string;
  hostToken: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  queue: QueueItem[];
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
}

export interface CreateRoomResponse {
  code: string;
  hostToken: string;
  shareUrl: string;
  hostUrl: string;
  persistence: Persistence;
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
export const MAX_URL = 300;
