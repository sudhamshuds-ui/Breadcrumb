"use client";

import { CardBanner } from "./CardBanner";
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
    <section ref={cardRef} className="mt-4">
      <button
        type="button"
        onClick={() => onStart("choose")}
        className="block w-full rounded-[28px] bg-white p-3.5 pb-6 text-left transition-transform duration-150 active:scale-[0.99]"
      >
        <CardBanner src="/illustrations/doctor.webp" />
        <span className="mt-4 block px-1.5 text-[24px] leading-tight tracking-[-0.02em]">Get professional help</span>
        <span className="mt-2 block px-1.5 text-[16.5px] leading-[1.4] tracking-[-0.01em] text-crumb-muted [text-wrap:pretty]">
          Talk to someone qualified about <span className="text-crumb-ink">{thread.care.topic}</span> before you buy.
        </span>
      </button>
    </section>
  );
}
