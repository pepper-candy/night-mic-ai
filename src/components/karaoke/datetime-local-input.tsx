"use client";

import type { ComponentProps, MouseEvent } from "react";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function openPicker(event: MouseEvent<HTMLButtonElement>) {
  const input = event.currentTarget.parentElement?.querySelector("input");
  if (!(input instanceof HTMLInputElement)) return;
  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
  } catch {
    // showPicker throws if the browser blocks it; fall through to focus.
  }
  input.focus();
}

export function DateTimeLocalInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  return (
    <div className="relative min-h-12 w-full min-w-0 flex-1">
      <Input
        {...props}
        type="datetime-local"
        className={cn(
          "h-12 min-h-12 w-full pr-11 text-base leading-normal scheme-dark",
          className,
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Open calendar"
        className="absolute top-1/2 right-1 grid size-9 min-h-9 min-w-9 -translate-y-1/2 place-items-center rounded-md text-foreground"
        onClick={openPicker}
      >
        <CalendarIcon className="size-5 text-foreground" strokeWidth={2} />
      </button>
    </div>
  );
}
