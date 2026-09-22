import { Suspense } from "react";
import { CohostRoomEntry } from "@/components/karaoke/cohost-room-entry";
import { LoadingState } from "@/components/karaoke/states";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { normalizeCode } from "@/lib/codes";

export default async function CohostRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return (
    <Suspense
      fallback={
        <AppShell>
          <BrandMark compact />
          <LoadingState label="Opening cohost desk…" />
        </AppShell>
      }
    >
      <CohostRoomEntry code={normalizeCode(code)} />
    </Suspense>
  );
}
