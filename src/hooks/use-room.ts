"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRoom } from "@/lib/api-client";
import type { PublicRoom } from "@/lib/types";

const POLL_MS = 1500;

type RoomState = {
  code: string;
  room: PublicRoom | null;
  error: string | null;
};

export function useRoom(code: string) {
  const [state, setState] = useState<RoomState>({
    code,
    room: null,
    error: null,
  });

  const apply = useCallback((next: PublicRoom) => {
    setState({ code: next.code, room: next, error: null });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchRoom(code);
      setState({ code, room: next, error: null });
    } catch (err) {
      setState((prev) => ({
        code,
        room: prev.code === code ? prev.room : null,
        error: err instanceof Error ? err.message : "Could not reach the room.",
      }));
    }
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const next = await fetchRoom(code);
        if (!cancelled) setState({ code, room: next, error: null });
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            code,
            room: prev.code === code ? prev.room : null,
            error: err instanceof Error ? err.message : "Could not reach the room.",
          }));
        }
      }
    }
    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [code]);

  const loading = state.code !== code || (state.room === null && state.error === null);

  return {
    room: state.code === code ? state.room : null,
    error: state.code === code ? state.error : null,
    loading,
    refresh,
    apply,
  };
}
