# Night Mic

Vercel: [Try it out on (night-mic.vercel.app)](night-mic.vercel.app)

YouTube: [Demo Video](https://youtube.com/shorts/jjqzBw_ijX8?feature=share)

A shared karaoke queue for a live party. The host opens a room, shouts a short code, and guests add songs from their phones. No install, no accounts — the room code is the door.

Built with Next.js (App Router), TypeScript, and Tailwind. Designed for phones first.

## How rooms work

1. **Host** taps **Host this night**. Night Mic mints a shoutable code like `VIBE 42` and a host session on that device.
2. Guests open the share link (`/room/VIBE42`) or type the code on the home page / `/join`.
3. Each guest picks a display name and submits a song: **title + artist required**, optional YouTube or karaoke URL.
4. Everyone in the room sees the same live queue. The host can:
   - promote a song to **now playing**
   - skip (marks current done and starts the next one)
   - move waiting songs up or down
   - remove a song
   - clear finished songs
   - seed three karaoke classics so the night starts in under a minute
5. Guests can cancel **their own** waiting song. They cannot reorder or touch anyone else’s.

Rooms go idle after **24 hours** without updates and then disappear.

Host controls stay on the device that created the room (cookie + local host token). There is a **host handoff link** on the host screen if you need to move the booth to another phone — do not share that link with the room.

## Quick start (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

Locally, rooms persist in `.data/rooms.json` so you do not need Redis to try the app. Create a room, add the three classics (or type a song), then open the guest view in another browser / phone on the same machine.

## Environment variables

Copy `.env.example` to `.env.local` if you want Redis locally.

| Variable | Required | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | On Vercel | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | On Vercel | Upstash Redis REST token |
| `KV_REST_API_URL` | Alternative | Vercel KV REST URL (same protocol) |
| `KV_REST_API_TOKEN` | Alternative | Vercel KV REST token |

Either the Upstash pair **or** the Vercel KV pair is enough. If both are set, Upstash wins.

**Persistence modes**

- Redis / KV configured → durable shared store (what you want at a party)
- Local without Redis → `.data/rooms.json`
- Vercel without Redis → in-memory only (each serverless instance has its own queue; do not use this for real guests)

## Deploy on Vercel

This project is meant to live on Vercel. If you started from Origin / Cursor and do not have a GitHub (or other Git) remote yet, create the repo first (the **Create repo** control in the project UI), then:

1. Import that git repository in [Vercel](https://vercel.com/new).
2. Framework preset: **Next.js**. Build command `next build`, output as usual.
3. Create a free [Upstash Redis](https://upstash.com) database (or add the Vercel KV / Upstash Marketplace integration).
4. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or the `KV_*` pair) in the Vercel project environment.
5. Deploy. Share the production URL — guests never install anything.

Origin and Vercel both speak git. Origin holds the source of truth for this working tree; Vercel builds whatever branch you connect. Point Vercel at `main` once the remote exists.

## Demo path (under a minute)

1. Open the site → **Host this night**.
2. On the host screen, tap **Add 3 classics**.
3. Copy the code or show the QR.
4. On a second phone, join and add one more song.
5. Back on the host: **Now playing**, skip, move a song, cancel from the guest phone.

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Route Handlers for the API
- Near-real-time sync via 1.5s polling (works on Vercel serverless; no long-lived socket server)
- `@upstash/redis` when credentials are present

Song entry is free text. There is no third-party karaoke catalog.

## Hardening later (not in this MVP)

The room code is the only gate. That is fine for a living-room party. Before you put this on the public internet for strangers:

- Add a host PIN or one-time join password
- Rate-limit room creation and song submits per IP (Redis `INCR`)
- Rotate / expire host tokens
- Moderate or cap URLs
- Turn on Vercel Deployment Protection or a simple allow-list if the instance is private
- Add abuse reporting and a max concurrent rooms quota

## Scripts

```bash
npm run dev      # http://localhost:3847
npm run build
npm run start
npm run lint
```
