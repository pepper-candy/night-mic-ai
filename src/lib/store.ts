import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { ROOM_IDLE_TTL_MS, type Persistence, type Room } from "@/lib/types";

const REDIS_TTL_SECONDS = Math.floor(ROOM_IDLE_TTL_MS / 1000);
const FILE_PATH = path.join(process.cwd(), ".data", "rooms.json");

type FileDb = Record<string, Room>;

const memoryRooms = new Map<string, Room>();
let fileLock: Promise<unknown> = Promise.resolve();
let redisClient: Redis | null | undefined;

function redisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const creds = redisCredentials();
  redisClient = creds ? new Redis(creds) : null;
  return redisClient;
}

export function getPersistence(): Persistence {
  if (getRedis()) return "redis";
  if (process.env.VERCEL === "1") return "memory";
  return "file";
}

function roomKey(code: string) {
  return `kara:room:${code}`;
}

function parseRoom(value: unknown): Room | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Room;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") return value as Room;
  return null;
}

function isExpired(room: Room) {
  return Date.now() - room.updatedAt > ROOM_IDLE_TTL_MS;
}

async function withFileLock<T>(fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const prev = fileLock;
  fileLock = gate;
  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    release();
  }
}

async function readFileDb(): Promise<FileDb> {
  try {
    const raw = await readFile(FILE_PATH, "utf8");
    return JSON.parse(raw) as FileDb;
  } catch {
    return {};
  }
}

async function writeFileDb(db: FileDb) {
  await mkdir(path.dirname(FILE_PATH), { recursive: true });
  await writeFile(FILE_PATH, JSON.stringify(db), "utf8");
}

async function redisGet(code: string): Promise<Room | null> {
  const redis = getRedis();
  if (!redis) return null;
  const room = parseRoom(await redis.get(roomKey(code)));
  if (!room) return null;
  if (isExpired(room)) {
    await redis.del(roomKey(code));
    return null;
  }
  return room;
}

async function redisSet(room: Room) {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured.");
  await redis.set(roomKey(room.code), JSON.stringify(room), { ex: REDIS_TTL_SECONDS });
}

async function fileGet(code: string): Promise<Room | null> {
  return withFileLock(async () => {
    const db = await readFileDb();
    const room = db[code];
    if (!room) return null;
    if (isExpired(room)) {
      delete db[code];
      await writeFileDb(db);
      return null;
    }
    return room;
  });
}

async function fileSet(room: Room) {
  await withFileLock(async () => {
    const db = await readFileDb();
    db[room.code] = room;
    await writeFileDb(db);
  });
}

function memoryGet(code: string): Room | null {
  const room = memoryRooms.get(code) ?? null;
  if (!room) return null;
  if (isExpired(room)) {
    memoryRooms.delete(code);
    return null;
  }
  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  const persistence = getPersistence();
  if (persistence === "redis") return redisGet(code);
  if (persistence === "file") return fileGet(code);
  return memoryGet(code);
}

export async function saveRoom(room: Room): Promise<void> {
  const persistence = getPersistence();
  if (persistence === "redis") {
    await redisSet(room);
    return;
  }
  if (persistence === "file") {
    await fileSet(room);
    return;
  }
  memoryRooms.set(room.code, room);
}

export async function updateRoom(
  code: string,
  mutator: (room: Room) => Room,
): Promise<Room> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = await getRoom(code);
    if (!current) {
      const error = new Error("Room not found.");
      (error as Error & { status?: number }).status = 404;
      throw error;
    }
    const next = mutator(current);
    const latest = await getRoom(code);
    if (!latest || latest.version !== current.version) continue;
    await saveRoom(next);
    return next;
  }
  const error = new Error("The queue changed on another phone. Try that again.");
  (error as Error & { status?: number }).status = 409;
  throw error;
}
