import { Suspense } from "react";
import { HostRoomEntry } from "@/components/karaoke/host-room-entry";
import { LoadingState } from "@/components/karaoke/states";
import { AppShell, BrandMark } from "@/components/karaoke/app-shell";
import { normalizeCode } from "@/lib/codes";

export default async function HostRoomPage({
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
          <LoadingState label="Opening the booth…" />
        </AppShell>
      }
    >
      <HostRoomEntry code={normalizeCode(code)} />
    </Suspense>
  );
}
