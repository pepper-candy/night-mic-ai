import { Button } from "@/components/ui/button";
import { Loader2Icon, MicOffIcon, PartyPopperIcon, VolumeXIcon } from "lucide-react";

export function LoadingState({ label = "Warming up the speakers…" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <Loader2Icon className="size-10 animate-spin text-cyan" />
      <p className="font-display text-3xl tracking-wide">{label}</p>
      <p className="text-sm text-muted-foreground">Checking the room, counting mics.</p>
    </div>
  );
}

export function ErrorState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-destructive/15 text-destructive">
        <VolumeXIcon className="size-8" />
      </div>
      <h1 className="font-display text-4xl tracking-wide">{title}</h1>
      <p className="max-w-sm text-base text-muted-foreground">{message}</p>
      {actionLabel && onAction ? (
        <Button className="h-12 px-6 text-base" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyQueue({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glow-panel flex flex-col items-center gap-3 px-5 py-10 text-center">
      <PartyPopperIcon className="size-9 text-gold" />
      <h2 className="font-display text-3xl tracking-wide">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}

export function LockedHost() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-secondary text-gold">
        <MicOffIcon className="size-8" />
      </div>
      <h1 className="font-display text-4xl tracking-wide">This stage is locked</h1>
      <p className="max-w-sm text-base text-muted-foreground">
        Host controls live on the phone that opened the room. Join as a guest and
        throw songs on the list instead.
      </p>
    </div>
  );
}
