"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CohostRoom } from "@/components/karaoke/cohost-room";

export function CohostRoomEntry({ code }: { code: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const cohostToken = params.get("cohost") ?? undefined;

  useEffect(() => {
    if (cohostToken) {
      router.replace(`/room/${code}/cohost`);
    }
  }, [code, cohostToken, router]);

  return <CohostRoom code={code} cohostTokenFromUrl={cohostToken} />;
}
