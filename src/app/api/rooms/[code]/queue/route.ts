import { readHostToken } from "@/lib/host-token";
import {
  errorResponse,
  hostClearDone,
  hostMove,
  hostSeed,
  hostSkip,
} from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const token = await readHostToken(code, request);

    if (action === "skip") {
      return Response.json(await hostSkip(code, token));
    }
    if (action === "clearDone") {
      return Response.json(await hostClearDone(code, token));
    }
    if (action === "seed") {
      return Response.json(await hostSeed(code, token));
    }
    if (action === "move") {
      const id = typeof body.id === "string" ? body.id : "";
      const direction = body.direction === "down" ? "down" : "up";
      if (!id) return Response.json({ error: "Missing song id." }, { status: 400 });
      return Response.json(await hostMove(code, token, id, direction));
    }
    return Response.json({ error: "Unknown queue action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
