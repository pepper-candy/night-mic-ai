import {
  getCohostToken,
  getHostToken,
  getStaffToken,
} from "@/lib/identity";
import type {
  CreateRoomResponse,
  PublicRoom,
  SongSearchHit,
} from "@/lib/types";

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

function hostHeaders(code: string): HeadersInit {
  const token = getHostToken(code);
  return token
    ? { "x-host-token": token, "content-type": "application/json" }
    : { "content-type": "application/json" };
}

function staffHeaders(code: string): HeadersInit {
  const token = getStaffToken(code);
  return token
    ? { "x-staff-token": token, "content-type": "application/json" }
    : { "content-type": "application/json" };
}

export async function createRoom(): Promise<CreateRoomResponse> {
  return parse<CreateRoomResponse>(await fetch("/api/rooms", { method: "POST" }));
}

export async function fetchRoom(code: string): Promise<PublicRoom> {
  return parse<PublicRoom>(await fetch(`/api/rooms/${code}`, { cache: "no-store" }));
}

export async function submitSong(
  code: string,
  input: {
    title: string;
    artist: string;
    url?: string;
    spotifyUrl?: string;
    language: string;
    languageOther?: string;
    displayName: string;
    guestId: string;
  },
): Promise<PublicRoom> {
  return parse<PublicRoom>(
    await fetch(`/api/rooms/${code}/songs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function songAction(
  code: string,
  id: string,
  action: "play" | "remove" | "cancel" | "edit",
  extra?: Record<string, unknown>,
): Promise<PublicRoom> {
  const headers =
    action === "cancel"
      ? { "content-type": "application/json" }
      : action === "play"
        ? hostHeaders(code)
        : staffHeaders(code);

  return parse<PublicRoom>(
    await fetch(`/api/rooms/${code}/songs/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ action, ...extra }),
    }),
  );
}

export async function queueAction(
  code: string,
  action: "skip" | "clearDone" | "seed" | "move",
  extra?: Record<string, string>,
): Promise<PublicRoom> {
  return parse<PublicRoom>(
    await fetch(`/api/rooms/${code}/queue`, {
      method: "PATCH",
      headers: hostHeaders(code),
      body: JSON.stringify({ action, ...extra }),
    }),
  );
}

export async function updateEvent(
  code: string,
  input: {
    title: string;
    description: string;
    location: string;
    startsAt: string | number;
    timezone?: string;
    clear?: boolean;
  },
): Promise<PublicRoom> {
  return parse<PublicRoom>(
    await fetch(`/api/rooms/${code}/event`, {
      method: "PATCH",
      headers: hostHeaders(code),
      body: JSON.stringify(input),
    }),
  );
}

export async function setValidation(
  code: string,
  enabled: boolean,
): Promise<{ room: PublicRoom; cohostToken?: string }> {
  return parse<{ room: PublicRoom; cohostToken?: string }>(
    await fetch(`/api/rooms/${code}/validation`, {
      method: "PATCH",
      headers: hostHeaders(code),
      body: JSON.stringify({ enabled }),
    }),
  );
}

export async function searchSongs(query: string): Promise<SongSearchHit[]> {
  const url = new URL("/api/songs/search", window.location.origin);
  url.searchParams.set("q", query);
  const data = await parse<{ results: SongSearchHit[] }>(
    await fetch(url.toString(), { cache: "no-store" }),
  );
  return data.results;
}

export function peekCohostToken(code: string) {
  return getCohostToken(code);
}
