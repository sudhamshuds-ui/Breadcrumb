"use client";

import { useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import type { Source, Thread } from "@/lib/types";
import { IllustratedCard } from "./CrumbSummary";
import { CardBanner } from "./CardBanner";
import { Modal } from "./Modal";

// What the evidence says: on the page, an illustrated card naming the top
// study. Every source is one tap away in a modal, each a card that opens to
// its plain-language summary and link. One open at a time.

const meta = (s: Source) => [s.type, s.publisher, s.year].filter(Boolean).join(" · ");

export function ResourcesCard({ thread }: { thread: Thread }) {
  const [open, setOpen] = useState(false);
  const top = thread.sources[0];
  if (!top) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 block w-full rounded-[28px] bg-white p-3.5 pb-5 text-left transition-transform duration-150 active:scale-[0.99]"
      >
        <CardBanner src="/illustrations/science.webp" />
        <span className="mt-4 flex items-baseline justify-between gap-3 px-1.5">
          <span className="text-[24px] leading-tight tracking-[-0.02em]">Scientific studies</span>
          <span className="shrink-0 text-[13px] text-crumb-muted">
            {thread.sources.length === 1 ? "1 source" : `1/${thread.sources.length} sources`}
          </span>
        </span>
        {/* The top study: what it is and who published it */}
        <span className="mt-3 line-clamp-3 block px-1.5 text-[16.5px] leading-snug font-medium tracking-[-0.01em] text-crumb-body [text-wrap:balance]">
          {top.title}
        </span>
        <span className="mt-1 block px-1.5 text-[13px] text-crumb-muted">{meta(top)}</span>
      </button>

      <ResourcesModal open={open} onClose={() => setOpen(false)} sources={thread.sources} />
    </>
  );
}

// Every source as the same card as the Crumb summary's flags: closed, its
// title and publisher with its picture cropped on the right; open, the
// picture as a banner, the summary and the link.
function ResourcesModal({ open, onClose, sources }: { open: boolean; onClose: () => void; sources: Source[] }) {
  const [openUrl, setOpenUrl] = useState<string | null>(sources[0]?.url ?? null);
  return (
    <Modal open={open} title="Scientific studies" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {sources.map((s) => (
          <IllustratedCard
            key={s.url}
            id={s.url}
            title={s.title}
            sub={meta(s)}
            image={s.image}
            open={openUrl === s.url}
            onToggle={() => setOpenUrl((cur) => (cur === s.url ? null : s.url))}
          >
            <p className="text-[13px] text-crumb-muted">{meta(s)}</p>
            <p className="mt-2.5 text-[14px] leading-snug text-crumb-body">{s.summary}</p>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex h-9 items-center gap-1 text-[14px] font-medium text-crumb-accent"
            >
              Read the source <ArrowUpRight size={15} />
            </a>
          </IllustratedCard>
        ))}
      </div>
    </Modal>
  );
}
