"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { HostRoom } from "@/components/karaoke/host-room";

export function HostRoomEntry({ code }: { code: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const hostToken = params.get("host") ?? undefined;

  useEffect(() => {
    if (hostToken) {
      router.replace(`/room/${code}/host`);
    }
  }, [code, hostToken, router]);

  return <HostRoom code={code} hostTokenFromUrl={hostToken} />;
}
