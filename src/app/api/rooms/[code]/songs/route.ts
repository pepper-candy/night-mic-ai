import { addSong, errorResponse } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const room = await addSong(code, {
      title: body.title,
      artist: body.artist,
      url: body.url,
      displayName: body.displayName,
      guestId: body.guestId,
    });
    return Response.json(room, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
