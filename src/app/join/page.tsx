import { Suspense } from "react";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { JoinSearch } from "@/components/karaoke/join-search";
import { LoadingState } from "@/components/karaoke/states";

export default function JoinPage() {
  return (
    <AppShell>
      <BrandMark />
      <div className="mt-8 glow-panel p-5">
        <Suspense fallback={<LoadingState label="Loading the door…" />}>
          <JoinSearch />
        </Suspense>
      </div>
    </AppShell>
  );
}
