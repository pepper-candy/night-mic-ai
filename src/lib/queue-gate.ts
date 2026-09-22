/** Guest intake: open unless the host paused it, or until a scheduled open time. */
export function isQueueAccepting(
  room: { queueOpen?: boolean; queueOpensAt?: number },
  now = Date.now(),
): boolean {
  if (room.queueOpen === false) {
    if (typeof room.queueOpensAt === "number" && now >= room.queueOpensAt) return true;
    return false;
  }
  return true;
}

export function queueClosedMessage(
  room: { queueOpensAt?: number },
  now = Date.now(),
): string {
  if (typeof room.queueOpensAt === "number" && room.queueOpensAt > now) {
    return "The host hasn't opened the queue yet.";
  }
  return "The host paused new songs.";
}
