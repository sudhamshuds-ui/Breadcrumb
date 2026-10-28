"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Reel, SignalKind, SummaryPart, Thread } from "@/lib/types";
import { EVIDENCE_EMOJI, KIND_EMOJI, type IconStyle } from "@/lib/icon-style";
import { CrumbGlyph } from "@/components/crumb/CrumbGlyph";
import { EVIDENCE_LINE } from "@/components/crumb/Findings";
import { inkStyle, KindMark, SignalIcon, TrustIcon, TrustMark } from "@/components/crumb/SignalIcon";
import { Modal } from "./Modal";

// What Crumb found, as one big sentence with icons in it and the findings in
// flowing signal ink. The detail (each flag, the exact words) is one tap
// away in a modal, so the page itself stays short.

type Mark = Exclude<SummaryPart, string>["mark"];

const EVIDENCE_WORD: Record<Thread["trust"]["evidence"], string> = {
  supported: "supported",
  mixed: "mixed",
  not_supported: "not linked",
  unknown: "not checked yet",
};

// Evidence has no signal kind of its own; it borrows the claim inks
// (lavender to blue), the same pastel its mark uses.
const inkKind = (mark: Mark): SignalKind => (mark === "evidence" ? "health_claim" : mark);

// Threads without a written summary get one built from the flags.
function fallbackSummary(reel: Reel, thread: Thread): SummaryPart[] {
  const parts: SummaryPart[] = [reel.tier === "flag" ? "Crumb found " : "Crumb noticed "];
  reel.signals.forEach((s, i) => {
    if (i > 0) parts.push(i === reel.signals.length - 1 ? " and " : ", ");
    parts.push({ text: s.label.toLowerCase(), mark: s.kind });
  });
  parts.push(". Evidence is ", { text: EVIDENCE_WORD[thread.trust.evidence], mark: "evidence" }, ".");
  return parts;
}

export function CrumbSummaryCard({
  reel,
  thread,
  iconStyle,
  onOpen,
}: {
  reel: Reel;
  thread: Thread;
  iconStyle: IconStyle;
  onOpen: () => void;
}) {
  const parts = thread.summary ?? fallbackSummary(reel, thread);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-[28px] bg-white px-3.5 pt-3.5 pb-6 text-left transition-transform duration-150 active:scale-[0.99]"
    >
      <span className="flex items-center justify-between gap-2 py-0.5 pr-0.5 pl-1.5">
        <span className="flex items-center gap-2 text-[17px] font-medium tracking-[-0.01em]">
          <CrumbGlyph size={22} /> Crumb summary
        </span>
        <span className="flex size-9 items-center justify-center rounded-full bg-crumb-surface text-crumb-body" aria-hidden>
          <ArrowUpRight size={18} />
        </span>
      </span>
      <span className="mt-5 block px-1.5 text-[19px] leading-[1.4] tracking-[-0.015em] text-crumb-muted [text-wrap:pretty]">
        {parts.map((p, i) =>
          typeof p === "string" ? (
            <span key={i}>{p}</span>
          ) : (
            <span key={i} className="whitespace-nowrap">
              <InlineMark mark={p.mark} iconStyle={iconStyle} />{" "}
              <span className="signal-ink on-light font-medium" style={inkStyle(inkKind(p.mark), "light")}>
                {p.text}
              </span>
            </span>
          ),
        )}
      </span>
      <span className="sr-only">Open the full summary</span>
    </button>
  );
}

// A small icon that sits in the line of text, like a word.
function InlineMark({ mark, iconStyle }: { mark: Mark; iconStyle: IconStyle }) {
  if (iconStyle === "line") {
    return (
      <span className="inline-flex translate-y-[2px] align-baseline text-crumb-ink">
        {mark === "evidence" ? <TrustIcon name="evidence" size={17} /> : <SignalIcon kind={mark} size={17} />}
      </span>
    );
  }
  return <span className="text-[0.85em]">{mark === "evidence" ? EVIDENCE_EMOJI : KIND_EMOJI[mark]}</span>;
}

export function CrumbSummaryModal({
  open,
  onClose,
  reel,
  thread,
  iconStyle,
}: {
  open: boolean;
  onClose: () => void;
  reel: Reel;
  thread: Thread;
  iconStyle: IconStyle;
}) {
  // One card open at a time: opening another folds the last one away.
  const [openId, setOpenId] = useState<string | null>(reel.signals[0]?.id ?? null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <Modal open={open} title="Crumb summary" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {reel.signals.map((s) => (
          <FoldCard
            key={s.id}
            title={s.label}
            mark={<KindMark kind={s.kind} style={iconStyle} size={36} />}
            open={openId === s.id}
            onToggle={() => toggle(s.id)}
          >
            <p className="text-[14px] leading-snug text-crumb-body">{s.detail}</p>
            {(s.quote ?? s.captionQuote) && (
              <p className="mt-2.5 rounded-[14px] bg-crumb-surface px-3 py-2.5 text-[14px] leading-snug text-crumb-muted">
                {s.quote ? "Said in the reel: " : "In the caption: "}
                &ldquo;
                <span className="signal-ink on-light font-semibold" style={inkStyle(s.kind, "light")}>
                  {s.quote ?? s.captionQuote}
                </span>
                &rdquo;
              </p>
            )}
          </FoldCard>
        ))}

        <FoldCard
          title={EVIDENCE_LINE[thread.trust.evidence]}
          mark={<TrustMark name="evidence" emoji={EVIDENCE_EMOJI} style={iconStyle} size={36} />}
          open={openId === "evidence"}
          onToggle={() => toggle("evidence")}
        >
          <p className="text-[14px] leading-snug text-crumb-body">{thread.evidenceNote}</p>
        </FoldCard>
      </div>
    </Modal>
  );
}

function FoldCard({
  title,
  mark,
  open,
  onToggle,
  children,
}: {
  title: string;
  mark: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="rounded-[22px] bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-3 pr-3 pl-4 text-left"
      >
        <span className="min-w-0 flex-1 text-[15.5px] font-medium">{title}</span>
        {mark}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
