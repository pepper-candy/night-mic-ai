import { getHostToken } from "@/lib/identity";
import type { CreateRoomResponse, PublicRoom } from "@/lib/types";

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

function hostHeaders(code: string): HeadersInit {
  const token = getHostToken(code);
  return token ? { "x-host-token": token, "content-type": "application/json" } : { "content-type": "application/json" };
}

export async function createRoom(): Promise<CreateRoomResponse> {
  return parse<CreateRoomResponse>(
    await fetch("/api/rooms", { method: "POST" }),
  );
}

export async function fetchRoom(code: string): Promise<PublicRoom> {
  return parse<PublicRoom>(await fetch(`/api/rooms/${code}`, { cache: "no-store" }));
}

export async function submitSong(
  code: string,
  input: { title: string; artist: string; url?: string; displayName: string; guestId: string },
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
  action: "play" | "remove" | "cancel",
  extra?: Record<string, string>,
): Promise<PublicRoom> {
  return parse<PublicRoom>(
    await fetch(`/api/rooms/${code}/songs/${id}`, {
      method: "PATCH",
      headers: hostHeaders(code),
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
