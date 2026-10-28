"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Source, Thread } from "@/lib/types";
import { firstSentence } from "@/lib/thread-view";
import { FoldCard } from "./CrumbSummary";
import { Modal } from "./Modal";

// What the evidence says: one top source on the page, as the one number
// worth seeing. Every source is one tap away in a modal, each a
// card that opens to its takeaway and link. One open at a time.

const meta = (s: Source) => [s.type, s.publisher, s.year].filter(Boolean).join(" · ");

export function ResourcesCard({ thread }: { thread: Thread }) {
  const [open, setOpen] = useState(false);
  const top = thread.sources[0];
  if (!top) return null;
  const h = top.highlight;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 block w-full rounded-[28px] bg-white px-3.5 pt-3.5 pb-6 text-left transition-transform duration-150 active:scale-[0.99]"
      >
        <span className="flex items-center justify-between gap-2 py-0.5 pr-0.5 pl-1.5">
          <span className="text-[17px] font-medium tracking-[-0.01em]">Scientific studies</span>
          <span className="flex size-9 items-center justify-center rounded-full bg-crumb-surface text-crumb-body" aria-hidden>
            <ArrowUpRight size={18} />
          </span>
        </span>
        <span className="mt-4 block px-1.5">
          {/* The study itself leads: what it is, who published it */}
          <span className="line-clamp-3 block text-[18px] leading-snug font-medium tracking-[-0.01em] [text-wrap:balance]">{top.title}</span>
          <span className="mt-1 block text-[13px] text-crumb-muted">{meta(top)}</span>
          {h && !h.compare ? (
            // One number on its own reads as a sentence: the number, then what it means
            <>
              <span className="mt-5 block text-[40px] leading-none tracking-[-0.04em] tabular-nums">{h.value}</span>
              <span className="mt-2 block text-[14px] leading-snug text-crumb-body">{capitalise(h.label)}</span>
            </>
          ) : h ? (
            <>
              <span className="mt-5 block text-[14px] leading-snug text-crumb-body">{capitalise(h.label)}</span>
              <span className="mt-3 grid grid-cols-2 gap-4">
                {compareRows(h).map((r) => (
                  <span key={r.label} className="block min-w-0">
                    <span
                      className={"block text-[40px] leading-none tracking-[-0.04em] tabular-nums " + (r.strong ? "" : "text-crumb-muted")}
                    >
                      {r.value}
                    </span>
                    <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-crumb-surface">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${r.share * 100}%`, background: r.strong ? "#26251e" : "#a09c92" }}
                      />
                    </span>
                    <span className="mt-1.5 block text-[13px] text-crumb-muted">{r.label}</span>
                  </span>
                ))}
              </span>
            </>
          ) : (
            <span className="mt-4 block text-[15px] leading-snug text-crumb-body">{firstSentence(top.summary)}</span>
          )}
          {thread.sources.length > 1 && (
            <span className="mt-4 block border-t border-crumb-hairline pt-3 text-[13px] text-crumb-muted">
              1 of {thread.sources.length} sources
            </span>
          )}
        </span>
        <span className="sr-only">Open all sources</span>
      </button>

      <ResourcesModal open={open} onClose={() => setOpen(false)} sources={thread.sources} />
    </>
  );
}

function ResourcesModal({ open, onClose, sources }: { open: boolean; onClose: () => void; sources: Source[] }) {
  const [openUrl, setOpenUrl] = useState<string | null>(sources[0]?.url ?? null);
  return (
    <Modal open={open} title="Scientific studies" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {sources.map((s) => (
          <FoldCard
            key={s.url}
            title={
              <>
                <span className="block leading-snug">{s.title}</span>
                <span className="mt-0.5 block text-[13px] font-normal text-crumb-muted">{meta(s)}</span>
              </>
            }
            mark={
              s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="size-12 shrink-0 rounded-[14px] object-cover" />
              ) : null
            }
            open={openUrl === s.url}
            onToggle={() => setOpenUrl((cur) => (cur === s.url ? null : s.url))}
          >
            {s.highlight && <Compare source={s} />}
            <p className="text-[14px] leading-snug text-crumb-body">{s.summary}</p>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex h-9 items-center gap-1 text-[14px] font-medium text-crumb-accent"
            >
              Read the source <ArrowUpRight size={15} />
            </a>
          </FoldCard>
        ))}
      </div>
    </Modal>
  );
}

// The headline number and its comparison, each with its share of the larger
// one, so both places draw the same bars.
function compareRows(h: NonNullable<Source["highlight"]>) {
  const rows = [{ label: "Treatment", value: h.value, strong: true }];
  if (h.compare) rows.push({ label: capitalise(h.compare.label.replace(/^on /, "")), value: h.compare.value, strong: false });
  const max = Math.max(...rows.map((r) => parseFloat(r.value) || 0), 1);
  return rows.map((r) => ({ ...r, share: (parseFloat(r.value) || 0) / max }));
}

// The headline number against its comparison, as two bars.
function Compare({ source }: { source: Source }) {
  const h = source.highlight!;
  if (!h.compare) {
    return (
      <div className="mb-3 rounded-[16px] bg-crumb-surface p-3">
        <p className="text-[28px] leading-none tracking-[-0.03em] tabular-nums">{h.value}</p>
        <p className="mt-1.5 text-[13px] leading-snug text-crumb-body">{capitalise(h.label)}</p>
      </div>
    );
  }
  const rows = compareRows(h);
  return (
    <div className="mb-3 rounded-[16px] bg-crumb-surface p-3">
      <p className="text-[13px] text-crumb-muted">{capitalise(h.label)}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2.5 text-[13px]">
            <span className="w-[72px] shrink-0 text-crumb-body">{r.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
              <span
                className="block h-full rounded-full"
                style={{ width: `${r.share * 100}%`, background: r.strong ? "#26251e" : "#a09c92" }}
              />
            </span>
            <span className="w-9 shrink-0 text-right font-medium tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
