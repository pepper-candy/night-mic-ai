"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCode } from "@/lib/codes";
import { CheckIcon, CopyIcon, QrCodeIcon, Share2Icon } from "lucide-react";

export function SharePanel({
  code,
  hostToken,
  hasEvent,
}: {
  code: string;
  hostToken?: string;
  hasEvent?: boolean;
}) {
  const [copied, setCopied] = useState<"code" | "link" | "invite" | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const shareUrl =
    typeof window === "undefined" ? `/room/${code}` : `${window.location.origin}/room/${code}`;
  const inviteUrl =
    typeof window === "undefined"
      ? `/invite/${code}`
      : `${window.location.origin}/invite/${code}`;
  const hostUrl =
    typeof window === "undefined"
      ? `/room/${code}/host`
      : `${window.location.origin}/room/${code}/host${hostToken ? `?host=${hostToken}` : ""}`;

  async function copy(label: "code" | "link" | "invite", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    const messages = {
      code: "Code copied. Shout it.",
      link: "Join link copied.",
      invite: "Invitation link copied.",
    } as const;
    toast.success(messages[label]);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Night Mic karaoke",
          text: hasEvent
            ? `You're invited — karaoke room ${formatCode(code)}`
            : `Join the karaoke queue — code ${formatCode(code)}`,
          url: hasEvent ? inviteUrl : shareUrl,
        });
        return;
      } catch {
        // User dismissed share sheet; fall through to copy.
      }
    }
    await copy(hasEvent ? "invite" : "link", hasEvent ? inviteUrl : shareUrl);
  }

  return (
    <section className="glow-panel space-y-4 p-4">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan">Room code</p>
        <p className="font-display text-6xl leading-none tracking-wide text-gold sm:text-7xl">
          {formatCode(code)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Guests open the link or type that code. Easy to shout across the room.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button className="h-12" variant="outline" onClick={() => void copy("code", code)}>
          {copied === "code" ? (
            <CheckIcon data-icon="inline-start" />
          ) : (
            <CopyIcon data-icon="inline-start" />
          )}
          Copy code
        </Button>
        <Button className="h-12 neon-button" onClick={() => void nativeShare()}>
          <Share2Icon data-icon="inline-start" />
          Share
        </Button>
      </div>
      <Button
        variant="outline"
        className="h-11 w-full"
        onClick={() => void copy("invite", inviteUrl)}
      >
        {copied === "invite" ? (
          <CheckIcon data-icon="inline-start" />
        ) : (
          <CopyIcon data-icon="inline-start" />
        )}
        Copy invitation link
      </Button>
      <Button variant="ghost" className="h-11 w-full" onClick={() => setQrOpen(true)}>
        <QrCodeIcon data-icon="inline-start" />
        Show join QR
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Keep the host screen on this device. Don&apos;t share the host link unless you
        are handing the party over.
      </p>
      <button
        type="button"
        className="mx-auto block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => void copy("link", hostUrl)}
      >
        Copy host handoff link
      </button>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle>Scan to join {formatCode(code)}</DialogTitle>
            <DialogDescription>
              Point a phone camera at this code. Guests pick a name, then add songs.
            </DialogDescription>
          </DialogHeader>
          <div className="mx-auto rounded-2xl bg-white p-3">
            <QRCodeSVG value={shareUrl} size={200} includeMargin />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
