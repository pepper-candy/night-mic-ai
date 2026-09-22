import type { Persistence, PublicRoom, QueueItem, Room } from "@/lib/types";

function normalizeSong(item: QueueItem): QueueItem {
  return {
    ...item,
    language: item.language || "english",
  };
}

export function toPublicRoom(room: Room, persistence: Persistence): PublicRoom {
  const queue = room.queue.map(normalizeSong);
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
  };
}
