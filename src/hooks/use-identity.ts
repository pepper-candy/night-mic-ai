"use client";

import { useSyncExternalStore } from "react";
import {
  bindRoomNickname as persistRoomNickname,
  getCohostToken,
  getDisplayName,
  getGuestId,
  getHostToken,
  getRoomNickname,
  getStaffToken,
  setCohostToken as persistCohostToken,
  setDisplayName as persistDisplayName,
  setHostToken as persistHostToken,
} from "@/lib/identity";

const IDENTITY_EVENT = "kara-identity";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(IDENTITY_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(IDENTITY_EVENT, onStoreChange);
  };
}

export function emitIdentityChange() {
  window.dispatchEvent(new Event(IDENTITY_EVENT));
}

export function useHasHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useDisplayName() {
  return useSyncExternalStore(subscribe, getDisplayName, () => "");
}

export function useRoomNickname(code: string) {
  return useSyncExternalStore(
    subscribe,
    () => (code ? getRoomNickname(code) : ""),
    () => "",
  );
}

export function useGuestId() {
  return useSyncExternalStore(subscribe, getGuestId, () => "");
}

export function useHostToken(code: string) {
  return useSyncExternalStore(
    subscribe,
    () => getHostToken(code) ?? "",
    () => "",
  );
}

export function useCohostToken(code: string) {
  return useSyncExternalStore(
    subscribe,
    () => getCohostToken(code) ?? "",
    () => "",
  );
}

export function useStaffToken(code: string) {
  return useSyncExternalStore(
    subscribe,
    () => getStaffToken(code) ?? "",
    () => "",
  );
}

export function saveDisplayName(name: string) {
  persistDisplayName(name);
  emitIdentityChange();
}

export function bindRoomNickname(code: string, name: string) {
  const bound = persistRoomNickname(code, name);
  persistDisplayName(bound);
  emitIdentityChange();
  return bound;
}

export function saveHostToken(code: string, token: string) {
  persistHostToken(code, token);
  emitIdentityChange();
}

export function saveCohostToken(code: string, token: string) {
  persistCohostToken(code, token);
  emitIdentityChange();
}
