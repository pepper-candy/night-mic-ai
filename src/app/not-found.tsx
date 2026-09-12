import Link from "next/link";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppShell>
      <BrandMark />
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <h1 className="font-display text-5xl tracking-wide">Wrong door</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          That page is not on tonight&apos;s set list.
        </p>
        <Button className="mt-6 h-12 px-6 neon-button" render={<Link href="/" />}>
          Back to Night Mic
        </Button>
      </div>
    </AppShell>
  );
}
