"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getThread } from "@/lib/data/threads";
import { CrumbGlyph } from "@/components/crumb/CrumbGlyph";

export function ThreadStub() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const thread = getThread(id);
  const back = `/reels?reel=${params.get("from") ?? "r1"}&t=${params.get("t") ?? "0"}`;

  return (
    <div className="crumb-type absolute inset-0 flex flex-col bg-crumb-surface text-crumb-ink">
      <div className="flex items-center gap-2 px-3 pt-14 pb-3">
        <Link href={back} className="flex h-11 items-center gap-0.5 rounded-full pr-4 text-[15px] font-medium active:bg-crumb-hairline">
          <ChevronLeft size={22} /> Back to reel
        </Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full border border-crumb-hairline-strong bg-crumb-card">
          <CrumbGlyph size={30} />
        </span>
        <h1 className="mt-5 text-[26px] leading-tight font-normal tracking-[-0.0125em]">
          {thread ? thread.productName : "Start a thread"}
        </h1>
        <p className="mt-2 max-w-[260px] text-[14px] leading-normal text-crumb-body">
          The Breadcrumb thread opens here. We&apos;ll design this screen next.
        </p>
      </div>
    </div>
  );
}
