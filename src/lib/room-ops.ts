import { nanoid } from "nanoid";
import { CLASSIC_TRACKS, HOUSE_DJ } from "@/lib/demo";
import {
  MAX_SONGS_PER_GUEST,
  MAX_SONGS_PER_ROOM,
  type EventInfo,
  type QueueItem,
  type Room,
  type SongLanguage,
} from "@/lib/types";

export class RoomError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function bump(room: Room): Room {
  return {
    ...room,
    version: room.version + 1,
    updatedAt: Date.now(),
  };
}

export function addSongToRoom(
  room: Room,
  input: {
    title: string;
    artist: string;
    url?: string;
    spotifyUrl?: string;
    language: SongLanguage;
    languageOther?: string;
    submittedBy: string;
    submitterId: string;
  },
): Room {
  if (room.queue.length >= MAX_SONGS_PER_ROOM) {
    throw new RoomError(`This room is packed — ${MAX_SONGS_PER_ROOM} song cap. Clear a few first.`);
  }

  const fromGuest = room.queue.filter((item) => item.submitterId === input.submitterId).length;
  if (fromGuest >= MAX_SONGS_PER_GUEST) {
    throw new RoomError(`Easy, superstar — ${MAX_SONGS_PER_GUEST} songs per person.`);
  }

  const song: QueueItem = {
    id: nanoid(10),
    title: input.title,
    artist: input.artist,
    url: input.url,
    spotifyUrl: input.spotifyUrl,
    language: input.language,
    languageOther: input.languageOther,
    submittedBy: input.submittedBy,
    submitterId: input.submitterId,
    status: "queued",
    createdAt: Date.now(),
  };

  return bump({
    ...room,
    queue: [...room.queue, song],
  });
}

export function seedClassics(room: Room): Room {
  let next = room;
  for (const track of CLASSIC_TRACKS) {
    const already = next.queue.some(
      (item) =>
        item.title.toLowerCase() === track.title.toLowerCase() &&
        item.artist.toLowerCase() === track.artist.toLowerCase(),
    );
    if (already) continue;
    next = addSongToRoom(next, {
      title: track.title,
      artist: track.artist,
      language: "english",
      submittedBy: HOUSE_DJ.name,
      submitterId: HOUSE_DJ.id,
    });
  }
  if (next.version === room.version) {
    throw new RoomError("Those classics are already on the list.");
  }
  return next;
}

export function playSong(room: Room, id: string): Room {
  const target = room.queue.find((item) => item.id === id);
  if (!target) throw new RoomError("That song already left the building.", 404);
  // Done songs can come back as an encore.

  const now = Date.now();
  return bump({
    ...room,
    queue: room.queue.map((item) => {
      if (item.status === "playing" && item.id !== id) {
        return { ...item, status: "done" as const, completedAt: now };
      }
      if (item.id === id) {
        return { ...item, status: "playing" as const, startedAt: now };
      }
      return item;
    }),
  });
}

export function skipPlaying(room: Room): Room {
  const playing = room.queue.find((item) => item.status === "playing");
  if (!playing) throw new RoomError("Nothing is on the mic right now.");

  const now = Date.now();
  const nextUp = room.queue.find((item) => item.status === "queued");

  return bump({
    ...room,
    queue: room.queue.map((item) => {
      if (item.id === playing.id) {
        return { ...item, status: "done" as const, completedAt: now };
      }
      if (nextUp && item.id === nextUp.id) {
        return { ...item, status: "playing" as const, startedAt: now };
      }
      return item;
    }),
  });
}

export function removeSong(room: Room, id: string): Room {
  const exists = room.queue.some((item) => item.id === id);
  if (!exists) throw new RoomError("Song not found.", 404);
  return bump({
    ...room,
    queue: room.queue.filter((item) => item.id !== id),
  });
}

export function cancelOwnSong(room: Room, id: string, guestId: string): Room {
  const item = room.queue.find((song) => song.id === id);
  if (!item) throw new RoomError("Song not found.", 404);
  if (item.submitterId !== guestId) {
    throw new RoomError("You can only cancel your own songs.", 403);
  }
  if (item.status !== "queued") {
    throw new RoomError("Too late — that one's already on stage or done.");
  }
  return removeSong(room, id);
}

export function editSongInRoom(
  room: Room,
  id: string,
  patch: {
    title: string;
    artist: string;
    url?: string;
    spotifyUrl?: string;
    language: SongLanguage;
    languageOther?: string;
  },
): Room {
  const exists = room.queue.some((item) => item.id === id);
  if (!exists) throw new RoomError("Song not found.", 404);

  return bump({
    ...room,
    queue: room.queue.map((item) => {
      if (item.id !== id) return item;
      return {
        ...item,
        title: patch.title,
        artist: patch.artist,
        url: patch.url,
        spotifyUrl: patch.spotifyUrl,
        language: patch.language,
        languageOther: patch.language === "other" ? patch.languageOther : undefined,
        modified: true,
      };
    }),
  });
}

export function moveQueued(room: Room, id: string, direction: "up" | "down"): Room {
  const queued = room.queue.filter((item) => item.status === "queued");
  const index = queued.findIndex((item) => item.id === id);
  if (index === -1) throw new RoomError("Only waiting songs can be reordered.");

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= queued.length) {
    return room;
  }

  const aId = queued[index]!.id;
  const bId = queued[swapWith]!.id;
  const next = room.queue.slice();
  const a = next.findIndex((item) => item.id === aId);
  const b = next.findIndex((item) => item.id === bId);
  const tmp = next[a]!;
  next[a] = next[b]!;
  next[b] = tmp;

  return bump({ ...room, queue: next });
}

export function reorderQueued(room: Room, ids: string[]): Room {
  const queued = room.queue.filter((item) => item.status === "queued");
  const queuedIds = new Set(queued.map((item) => item.id));
  if (ids.length !== queued.length || ids.some((id) => !queuedIds.has(id))) {
    throw new RoomError("Reorder list does not match the current queue.");
  }

  const byId = new Map(queued.map((item) => [item.id, item]));
  const reordered = ids.map((id) => byId.get(id)!);
  const others = room.queue.filter((item) => item.status !== "queued");

  return bump({
    ...room,
    queue: [
      ...others.filter((item) => item.status === "playing"),
      ...reordered,
      ...others.filter((item) => item.status === "done"),
    ],
  });
}

export function clearCompleted(room: Room): Room {
  const remaining = room.queue.filter((item) => item.status !== "done");
  if (remaining.length === room.queue.length) {
    throw new RoomError("No finished songs to clear.");
  }
  return bump({ ...room, queue: remaining });
}

export function setRoomEvent(room: Room, event: EventInfo | undefined): Room {
  return bump({
    ...room,
    event,
  });
}

export function setValidationMode(room: Room, enabled: boolean): Room {
  if (enabled) {
    return bump({
      ...room,
      validationEnabled: true,
      cohostToken: room.cohostToken || nanoid(24),
    });
  }
  return bump({
    ...room,
    validationEnabled: false,
    // Keep the token so turning validation back on reuses the same cohost link.
  });
}
