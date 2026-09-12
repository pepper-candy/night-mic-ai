import { nanoid } from "nanoid";
import { generateRoomCode, isValidCode, normalizeCode } from "@/lib/codes";
import { toPublicRoom } from "@/lib/public-room";
import {
  addSongToRoom,
  cancelOwnSong,
  clearCompleted,
  moveQueued,
  playSong,
  removeSong,
  RoomError,
  seedClassics,
  skipPlaying,
} from "@/lib/room-ops";
import { getPersistence, getRoom, saveRoom, updateRoom } from "@/lib/store";
import type { CreateRoomResponse, PublicRoom, Room } from "@/lib/types";
import {
  validateArtist,
  validateGuestId,
  validateName,
  validateTitle,
  validateUrl,
} from "@/lib/validation";

function hostCookieName(code: string) {
  return `kara_host_${code}`;
}

export function getHostCookieName(code: string) {
  return hostCookieName(normalizeCode(code));
}

export async function createRoom(): Promise<{ room: Room; response: CreateRoomResponse }> {
  for (let i = 0; i < 12; i++) {
    const code = generateRoomCode();
    const existing = await getRoom(code);
    if (existing) continue;

    const now = Date.now();
    const room: Room = {
      code,
      hostToken: nanoid(24),
      createdAt: now,
      updatedAt: now,
      version: 1,
      queue: [],
    };
    await saveRoom(room);
    return {
      room,
      response: {
        code,
        hostToken: room.hostToken,
        shareUrl: `/room/${code}`,
        hostUrl: `/room/${code}/host`,
        persistence: getPersistence(),
      },
    };
  }
  throw new RoomError("Could not mint a unique room code. Try again.", 500);
}

export async function readPublicRoom(rawCode: string): Promise<PublicRoom> {
  const code = normalizeCode(rawCode);
  if (!isValidCode(code)) throw new RoomError("That code doesn't look like a Night Mic room.", 400);
  const room = await getRoom(code);
  if (!room) throw new RoomError("No room with that code. Did someone shout it wrong?", 404);
  return toPublicRoom(room, getPersistence());
}

export function assertHost(room: Room, token: string | undefined) {
  if (!token || token !== room.hostToken) {
    throw new RoomError("Host controls stay with the person who opened the room.", 403);
  }
}

export async function hostMutate(
  rawCode: string,
  token: string | undefined,
  mutator: (room: Room) => Room,
): Promise<PublicRoom> {
  const code = normalizeCode(rawCode);
  const room = await getRoom(code);
  if (!room) throw new RoomError("No room with that code.", 404);
  assertHost(room, token);
  const next = await updateRoom(code, mutator);
  return toPublicRoom(next, getPersistence());
}

export async function addSong(
  rawCode: string,
  input: {
    title: unknown;
    artist: unknown;
    url: unknown;
    displayName: unknown;
    guestId: unknown;
  },
): Promise<PublicRoom> {
  const code = normalizeCode(rawCode);
  return toPublicRoom(
    await updateRoom(code, (room) =>
      addSongToRoom(room, {
        title: validateTitle(input.title),
        artist: validateArtist(input.artist),
        url: validateUrl(input.url),
        submittedBy: validateName(input.displayName),
        submitterId: validateGuestId(input.guestId),
      }),
    ),
    getPersistence(),
  );
}

export async function hostPlay(code: string, token: string | undefined, id: string) {
  return hostMutate(code, token, (room) => playSong(room, id));
}

export async function hostSkip(code: string, token: string | undefined) {
  return hostMutate(code, token, (room) => skipPlaying(room));
}

export async function hostRemove(code: string, token: string | undefined, id: string) {
  return hostMutate(code, token, (room) => removeSong(room, id));
}

export async function hostMove(
  code: string,
  token: string | undefined,
  id: string,
  direction: "up" | "down",
) {
  return hostMutate(code, token, (room) => moveQueued(room, id, direction));
}

export async function hostClearDone(code: string, token: string | undefined) {
  return hostMutate(code, token, (room) => clearCompleted(room));
}

export async function hostSeed(code: string, token: string | undefined) {
  return hostMutate(code, token, (room) => seedClassics(room));
}

export async function guestCancel(rawCode: string, id: string, guestId: unknown) {
  const code = normalizeCode(rawCode);
  return toPublicRoom(
    await updateRoom(code, (room) => cancelOwnSong(room, id, validateGuestId(guestId))),
    getPersistence(),
  );
}

export function errorResponse(error: unknown) {
  if (error instanceof RoomError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
  const message = error instanceof Error ? error.message : "Something blew a speaker.";
  return Response.json({ error: message }, { status: Number.isFinite(status) && status >= 400 ? status : 500 });
}
