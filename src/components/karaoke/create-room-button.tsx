"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveHostToken } from "@/hooks/use-identity";
import { createRoom } from "@/lib/api-client";

export function CreateRoomButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onCreate() {
    setPending(true);
    try {
      const room = await createRoom();
      saveHostToken(room.code, room.hostToken);
      router.push(`/room/${room.code}/host`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open a room.");
      setPending(false);
    }
  }

  return (
    <Button
      className="h-14 w-full text-base neon-button"
      disabled={pending}
      onClick={() => void onCreate()}
    >
      {pending ? "Lighting the stage…" : "Host this night"}
    </Button>
  );
}
