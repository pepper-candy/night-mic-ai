import { DEFAULT_EVENT_TIMEZONE, isEventTimezone, zonedLocalToUtcMs } from "@/lib/event-time";
import { readHostToken } from "@/lib/host-token";
import { errorResponse, hostSetQueueGate } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const token = await readHostToken(code, request);
    const open = body.open !== false;

    let opensAt: number | undefined;
    if (!open && body.opensAt != null && body.opensAt !== "") {
      if (typeof body.opensAt === "number") {
        opensAt = body.opensAt;
      } else if (typeof body.opensAt === "string") {
        const timezoneRaw = typeof body.timezone === "string" ? body.timezone.trim() : "";
        const timezone = timezoneRaw && isEventTimezone(timezoneRaw)
          ? timezoneRaw
          : DEFAULT_EVENT_TIMEZONE;
        const raw = body.opensAt.trim();
        opensAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && !/[zZ]|[+-]\d{2}:\d{2}$/.test(raw)
          ? zonedLocalToUtcMs(raw, timezone)
          : Date.parse(raw);
      }
      if (opensAt != null && !Number.isFinite(opensAt)) {
        return Response.json({ error: "That open time does not look valid." }, { status: 400 });
      }
    }

    const room = await hostSetQueueGate(code, token, { open, opensAt });
    return Response.json(room);
  } catch (error) {
    return errorResponse(error);
  }
}
