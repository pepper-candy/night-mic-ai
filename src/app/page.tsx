import Link from "next/link";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { CreateRoomButton } from "@/components/karaoke/create-room-button";
import { JoinForm } from "@/components/karaoke/join-form";

export default function HomePage() {
  return (
    <AppShell>
      <header className="pt-4">
        <BrandMark />
        <h1 className="mt-8 font-display text-5xl leading-[0.9] tracking-wide sm:text-6xl">
          Pass the mic.
          <span className="block text-gold">Keep the queue honest.</span>
        </h1>
        <p className="mt-4 max-w-md text-base text-muted-foreground">
          A shared karaoke list for the party. Hosts run the room. Guests add
          songs from their phones. No app install. No accounts.
        </p>
      </header>

      <div className="mt-8 grid gap-4">
        <section className="glow-panel space-y-4 p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Host</p>
            <h2 className="font-display text-3xl tracking-wide">Open a room</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You get a shoutable code and a live queue you can reorder, skip,
              and mark now playing.
            </p>
          </div>
          <CreateRoomButton />
        </section>

        <section className="glow-panel space-y-4 p-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan">Guest</p>
            <h2 className="font-display text-3xl tracking-wide">Join a room</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the code they just yelled. Pick a name. Throw your song on
              the list.
            </p>
          </div>
          <JoinForm compact />
        </section>
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        Works on phones. Deep links look like{" "}
        <span className="text-foreground">/room/VIBE42</span>.{" "}
        <Link href="/join" className="text-cyan underline-offset-4 hover:underline">
          Join page
        </Link>
      </footer>
    </AppShell>
  );
}
