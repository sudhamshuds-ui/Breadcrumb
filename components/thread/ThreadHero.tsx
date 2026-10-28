"use client";

import Link from "next/link";
import type { Reel, Thread } from "@/lib/types";

// The top of a thread: whose post, what it's about, and the three trust
// signals as three separate pills. Never one score: a single number implies
// a certainty the brief warns against.

const EVIDENCE_PILL: Record<Thread["trust"]["evidence"], string> = {
  not_supported: "No evidence linked",
  mixed: "Evidence mixed",
  supported: "Evidence supports it",
  unknown: "No sources yet",
};

export function ThreadHero({ thread, reel, backUrl }: { thread: Thread; reel: Reel; backUrl: string }) {
  const flags = reel.signals.length;
  const facts = reel.tier !== "flag";
  const c = thread.trust.community;
  const friends = thread.friendNames.length;

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

      <ul className="mt-4 flex flex-wrap justify-center gap-1.5 text-[12.5px] font-medium">
        <li
          className="rounded-full px-2.5 py-1.5"
          style={facts ? { background: "#FFF1D6", color: "#7A4A00" } : { background: "#FDE4E4", color: "#A61B1B" }}
        >
          {facts ? `${flags} stated` : `${flags} ${flags === 1 ? "flag" : "flags"}`}
        </li>
        <li className="rounded-full bg-white px-2.5 py-1.5">{EVIDENCE_PILL[thread.trust.evidence]}</li>
        <li className="rounded-full bg-white px-2.5 py-1.5">
          {friends > 0 ? `${friends} ${friends === 1 ? "friend" : "friends"} reviewed` : `${c.reviews} reviews`}
        </li>
      </ul>
    </section>
  );
}
