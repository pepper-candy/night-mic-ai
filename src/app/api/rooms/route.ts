import { createRoom, errorResponse } from "@/lib/rooms";
import { writeHostCookie } from "@/lib/host-token";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { response } = await createRoom();
    await writeHostCookie(response.code, response.hostToken);
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
