"use client";

import { useSearchParams } from "next/navigation";
import { JoinForm } from "@/components/karaoke/join-form";

export function JoinSearch() {
  const params = useSearchParams();
  return <JoinForm initialCode={params.get("code") ?? ""} />;
}
