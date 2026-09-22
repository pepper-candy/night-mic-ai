import { errorResponse } from "@/lib/rooms";
import { getSongSearchCatalogs, searchSongs } from "@/lib/song-search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    if (q.trim().length < 2) {
      return Response.json({ results: [], catalogs: getSongSearchCatalogs() });
    }
    const payload = await searchSongs(q, 8);
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
