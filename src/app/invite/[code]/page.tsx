import { InvitePage } from "@/components/karaoke/invite-page";
import { normalizeCode } from "@/lib/codes";

export default async function InviteRoute({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <InvitePage code={normalizeCode(code)} />;
}
