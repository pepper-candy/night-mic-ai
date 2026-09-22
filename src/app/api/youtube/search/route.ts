import { errorResponse } from "@/lib/rooms";
import { clientIp, findYoutubeVideos, rateLimitYoutubeSearch } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return Response.json({ results: [] }, { headers: { "Cache-Control": "no-store" } });
    }
    rateLimitYoutubeSearch(clientIp(request));
    const results = await findYoutubeVideos(q);
    return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
