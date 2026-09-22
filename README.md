# Night Mic

Vercel: [Try it out on (night-mic.vercel.app)](night-mic.vercel.app)

YouTube: [Demo Video](https://youtube.com/shorts/jjqzBw_ijX8?feature=share)

A shared karaoke queue for a live party. The host opens a room, shouts a short code, and guests add songs from their phones. No install, no accounts — the room code is the door.

Built with Next.js (App Router), TypeScript, and Tailwind. Designed for phones first.

## How rooms work

1. **Host** taps **Host this night**. Night Mic mints a shoutable code like `VIBE 42` and a host session on that device.
2. Guests open the share link (`/room/VIBE42`) or type the code on the home page / `/join`.
3. Each guest picks a nickname and can add a song with just a **title**. Title search uses Apple Music (free, no YouTube quota) and fills **artist** (and language when we can tell). After title/artist look right, **Find link** spends YouTube quota once, shows up to 5 karaoke videos one at a time (Yes / Next / Back), and fills the watch URL. Paste a URL still works. Language, a message to the audience, and the link live under **More**.
4. On the host screen, **Play / Pause / Skip** drive an embedded YouTube player for the current song. When the video ends, the queue advances to the next singer.
5. Hosts can **pause** guest song intake or schedule when the queue opens. The add-song panel greys out until then. Hosts can still add songs.
6. Hosts can publish an **invitation** (`/invite/CODE`) with title, description, location, and start time — guests see a live countdown on the invite and after they join, until the event starts.
7. Optional **link validation**: host turns it on and shares a **cohost link**. That second device embeds YouTube/Spotify previews, and host/cohost can edit any queued song (cards show a green **Verified** tag next to the language).
8. Everyone in the room sees the same live queue. The host can:
   - promote a song to **now playing**
   - play / pause the embedded YouTube player
   - skip (marks current done and starts the next one; also happens when the video ends)
   - move waiting songs up or down
   - edit or remove a song
   - clear finished songs
   - seed three karaoke classics so the night starts in under a minute
9. Guests can cancel **their own** waiting song. They cannot reorder or touch anyone else’s.

Rooms go idle after **24 hours** without updates and then disappear.

Host controls stay on the device that created the room (cookie + local host token). There is a **host handoff link** on the host screen if you need to move the booth to another phone — do not share that link with the room. The cohost link is only for a trusted validation phone.

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
| `YOUTUBE_API_KEY` | Optional | YouTube Data API v3 — **Find link** on add/edit song (server-only) and host embed. Without it, guests can still paste a YouTube URL. |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Optional | Spotify Client Credentials — upgrade search-page links to exact track URLs |

Either the Upstash pair **or** the Vercel KV pair is enough. If both are set, Upstash wins.

Title/artist catalog search **always** works without keys and **never** calls YouTube: Apple’s free iTunes Search API (US + HK) fills title + artist and a language guess. **Find link** is an explicit tap and needs `YOUTUBE_API_KEY`. Paste-a-URL remains the fallback.

### YouTube Data API v3 (`YOUTUBE_API_KEY`)

Used only on the server (`/api/youtube/search`). The key is never sent to the browser. Typing a title does **not** hit YouTube.

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **APIs & Services → Library** → enable **YouTube Data API v3**.
4. **APIs & Services → Credentials → Create credentials → API key**.
5. Restrict the key to YouTube Data API v3 if you can.
6. Local: set `YOUTUBE_API_KEY` in `.env.local`.
7. Production: add the same variable in the [Vercel project environment](https://vercel.com/docs/projects/environment-variables) and redeploy.

**Find link** (after title/artist are set) does:

1. `search.list` — `q="{title} {artist} karaoke"`, `type=video`, `maxResults=5` (**100** quota units)
2. `videos.list` — those 5 ids, `part=contentDetails,snippet` for duration (**~1** unit)

Default daily quota is **10,000** units ⇒ about **100 Find link taps/day**. The UI never searches on keystroke. A second Find link is allowed but warned. Missing key and `quotaExceeded` show a clear message; guests can still paste a watch URL.

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

Song entry is free text with optional catalog search (iTunes, no YouTube quota) plus an explicit **Find link** when `YOUTUBE_API_KEY` is set. Paste-URL still works. The host booth plays the current queue item in an embedded YouTube IFrame player (play, pause, skip, auto-advance).

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
