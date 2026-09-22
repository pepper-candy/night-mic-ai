import { readHostToken, writeCohostCookie } from "@/lib/host-token";
import { errorResponse, hostSetValidation } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const token = await readHostToken(code, request);
    const enabled = body.enabled === true;
    const result = await hostSetValidation(code, token, enabled);
    if (enabled && result.cohostToken) {
      await writeCohostCookie(code, result.cohostToken);
    }
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
