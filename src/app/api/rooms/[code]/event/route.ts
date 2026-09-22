import { readHostToken } from "@/lib/host-token";
import { errorResponse, hostUpdateEvent } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const token = await readHostToken(code, request);
    const room = await hostUpdateEvent(code, token, {
      title: body.title,
      description: body.description,
      location: body.location,
      startsAt: body.startsAt,
      clear: body.clear,
    });
    return Response.json(room);
  } catch (error) {
    return errorResponse(error);
  }
}
