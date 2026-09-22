import type { Persistence, PublicRoom, Room } from "@/lib/types";

export function toPublicRoom(room: Room, persistence: Persistence): PublicRoom {
  const queue = room.queue;
  const nowPlaying = queue.find((item) => item.status === "playing") ?? null;
  const upNext = queue.filter((item) => item.status === "queued");
  const done = queue
    .filter((item) => item.status === "done")
    .slice()
    .reverse();

  return {
    code: room.code,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    version: room.version,
    queue,
    nowPlaying,
    upNext,
    done,
    persistence,
    event: room.event,
    validationEnabled: Boolean(room.validationEnabled),
    hasCohost: Boolean(room.cohostToken),
    queueOpen: room.queueOpen !== false,
    queueOpensAt: room.queueOpensAt,
  };
}
