import { readStaffToken } from "@/lib/host-token";
import {
  errorResponse,
  guestCancel,
  hostPlay,
  staffEditSong,
  staffRemove,
} from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ code: string; id: string }> },
) {
  try {
    const { code, id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const token = await readStaffToken(code, request);

    if (action === "play") {
      return Response.json(await hostPlay(code, token, id));
    }
    if (action === "remove") {
      return Response.json(await staffRemove(code, token, id));
    }
    if (action === "edit") {
      return Response.json(
        await staffEditSong(code, token, id, {
          title: body.title,
          artist: body.artist,
          url: body.url,
          spotifyUrl: body.spotifyUrl,
          language: body.language,
          languageOther: body.languageOther,
          message: body.message,
        }),
      );
    }
    if (action === "cancel") {
      return Response.json(await guestCancel(code, id, body.guestId));
    }
    return Response.json({ error: "Unknown song action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ code: string; id: string }> },
) {
  try {
    const { code, id } = await context.params;
    const token = await readStaffToken(code, request);
    if (token) {
      return Response.json(await staffRemove(code, token, id));
    }
    const url = new URL(request.url);
    const guestId = url.searchParams.get("guestId");
    return Response.json(await guestCancel(code, id, guestId));
  } catch (error) {
    return errorResponse(error);
  }
}
