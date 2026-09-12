import { GuestRoom } from "@/components/karaoke/guest-room";
import { normalizeCode } from "@/lib/codes";

export default async function GuestRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <GuestRoom code={normalizeCode(code)} />;
}
