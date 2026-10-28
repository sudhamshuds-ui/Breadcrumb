"use client";

import { ArrowUpRight } from "lucide-react";
import type { Thread } from "@/lib/types";
import type { CareStart } from "./CareSheet";

// The way to a professional, last on the page and the main goal of a visit.
// Same card as the others, with the accent kept for it alone: one line on
// what to talk about. The options (book a GP, schedule a call, healthdirect)
// open in a modal card, like every other section's detail.

export function CareCard({
  thread,
  onStart,
  cardRef,
}: {
  thread: Thread;
  onStart: (start: CareStart) => void;
  cardRef?: React.Ref<HTMLElement>;
}) {
  return (
    <section ref={cardRef} className="mt-3">
      <button
        type="button"
        onClick={() => onStart("choose")}
        className="block w-full rounded-[28px] bg-white px-3.5 pt-3.5 pb-6 text-left transition-transform duration-150 active:scale-[0.99]"
      >
        <span className="flex items-center justify-between gap-2 py-0.5 pr-0.5 pl-1.5">
          <span className="text-[17px] font-medium tracking-[-0.01em]">Get professional help</span>
          <span className="flex size-9 items-center justify-center rounded-full bg-crumb-accent text-white" aria-hidden>
            <ArrowUpRight size={18} />
          </span>
        </span>
        <span className="mt-5 block px-1.5 text-[19px] leading-[1.4] tracking-[-0.015em] text-crumb-muted [text-wrap:pretty]">
          Talk to someone qualified about <span className="text-crumb-ink">{thread.care.topic}</span> before you buy.
        </span>
      </button>
    </section>
  );
}
