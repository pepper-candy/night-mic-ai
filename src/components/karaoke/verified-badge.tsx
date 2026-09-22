"use client";

import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "lucide-react";

/** Green pill matching the language tag, shown after host/cohost edit. */
export function VerifiedBadge() {
  return (
    <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">
      <CheckIcon data-icon="inline-start" />
      Verified
    </Badge>
  );
}
