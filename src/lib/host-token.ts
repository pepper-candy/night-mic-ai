import { cookies } from "next/headers";
import { getCohostCookieName, getHostCookieName } from "@/lib/rooms";

export async function readHostToken(code: string, request: Request): Promise<string | undefined> {
  const header = request.headers.get("x-host-token")?.trim();
  if (header) return header;

  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const store = await cookies();
  return store.get(getHostCookieName(code))?.value;
}

/** Prefer explicit staff token header; fall back to host then cohost cookies. */
export async function readStaffToken(code: string, request: Request): Promise<string | undefined> {
  const staffHeader =
    request.headers.get("x-staff-token")?.trim() ||
    request.headers.get("x-host-token")?.trim() ||
    request.headers.get("x-cohost-token")?.trim();
  if (staffHeader) return staffHeader;

  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const store = await cookies();
  return (
    store.get(getHostCookieName(code))?.value ||
    store.get(getCohostCookieName(code))?.value
  );
}

export async function writeHostCookie(code: string, token: string) {
  const store = await cookies();
  store.set(getHostCookieName(code), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function writeCohostCookie(code: string, token: string) {
  const store = await cookies();
  store.set(getCohostCookieName(code), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}
