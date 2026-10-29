"use client";

import Link from "next/link";
import type { Reel, Thread } from "@/lib/types";

// The top of a thread: whose post and what it's about. The trust signals
// live in the Crumb summary card right below.

export function ThreadHero({ thread, reel, backUrl }: { thread: Thread; reel: Reel; backUrl: string }) {
  return (
    <section className="flex flex-col items-center px-1 pt-6 pb-2 text-center">
      <Link
        href={backUrl}
        replace
        className="flex h-8 items-center gap-1.5 rounded-full pr-2.5 pl-1 text-[13.5px] text-crumb-body active:bg-black/5"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={reel.creator.avatar} alt="" className="size-6 rounded-full object-cover" />
        {reel.creator.handle}
      </Link>

      <h1 className="mt-2 text-[32px] leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">{thread.productName}</h1>
    </section>
  );
}
