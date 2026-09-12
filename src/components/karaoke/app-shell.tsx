import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 karaoke-atmosphere" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:max-w-2xl sm:px-6">
        <div className={cn("flex flex-1 flex-col", className)}>{children}</div>
      </div>
    </div>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", compact && "opacity-90")}>
      <span className="grid size-9 place-items-center rounded-full bg-primary text-lg shadow-[0_0_18px_rgba(255,47,146,0.55)]">
        ♪
      </span>
      <div className="leading-none">
        <p className="font-display text-2xl tracking-wide text-primary-foreground">
          Night Mic
        </p>
        {!compact ? (
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan">
            Karaoke queue
          </p>
        ) : null}
      </div>
    </div>
  );
}
