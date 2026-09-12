import type { Persistence, PublicRoom, Room } from "@/lib/types";

export function toPublicRoom(room: Room, persistence: Persistence): PublicRoom {
  const nowPlaying = room.queue.find((item) => item.status === "playing") ?? null;
  const upNext = room.queue.filter((item) => item.status === "queued");
  const done = room.queue
    .filter((item) => item.status === "done")
    .slice()
    .reverse();

  return {
    code: room.code,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    version: room.version,
    queue: room.queue,
    nowPlaying,
    upNext,
    done,
    persistence,
  };
}
