"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { Reel, SignalKind, SummaryPart, Thread } from "@/lib/types";
import { EVIDENCE_EMOJI, KIND_EMOJI, type IconStyle } from "@/lib/icon-style";
import { CrumbGlyph } from "@/components/crumb/CrumbGlyph";
import { EVIDENCE_ILLUSTRATION, illustrationFor } from "@/components/crumb/illustrations";
import { EVIDENCE_LINE } from "@/components/crumb/Findings";
import { inkStyle, SignalIcon, TrustIcon } from "@/components/crumb/SignalIcon";
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
}: {
  open: boolean;
  onClose: () => void;
  reel: Reel;
  thread: Thread;
}) {
  // One card open at a time: opening another folds the last one away.
  const [openId, setOpenId] = useState<string | null>(reel.signals[0]?.id ?? null);
  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <Modal open={open} title="Crumb summary" onClose={onClose}>
      <div className="flex flex-col gap-2">
        {reel.signals.map((s) => (
          <IllustratedCard
            key={s.id}
            id={s.id}
            title={s.label}
            sub={s.quote ? "Mentioned in the reel" : "Flagged in the caption"}
            image={illustrationFor(s)}
            open={openId === s.id}
            onToggle={() => toggle(s.id)}
          >
            <p className="text-[14px] leading-snug text-crumb-body">{s.detail}</p>
            {(s.quote ?? s.captionQuote) && (
              <p className="mt-2.5 text-[14px] leading-snug text-crumb-muted">
                <span className="signal-ink on-light font-semibold" style={inkStyle(s.kind, "light")}>
                  {s.quote ?? s.captionQuote}
                </span>
              </p>
            )}
          </IllustratedCard>
        ))}

        <IllustratedCard
          id="evidence"
          title={EVIDENCE_LINE[thread.trust.evidence]}
          sub={`From ${thread.sources.length} linked ${thread.sources.length === 1 ? "source" : "sources"}`}
          image={EVIDENCE_ILLUSTRATION}
          open={openId === "evidence"}
          onToggle={() => toggle("evidence")}
        >
          <p className="text-[14px] leading-snug text-crumb-body">{thread.evidenceNote}</p>
        </IllustratedCard>
      </div>
    </Modal>
  );
}

// A flag as a card with its illustration (Figma "summary card", 1470-487).
// Closed: title, where it was found, and the picture cropped in a small tile.
// Open: the picture unfolds as a banner above the title, and the detail and
// exact words follow underneath.
function IllustratedCard({
  title,
  sub,
  image,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  sub: string;
  image?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  // Only height and opacity move, so nothing stretches: the banner unfolds
  // above the title while the thumbnail fades out of the row.
  const ease = [0.22, 1, 0.36, 1] as const;
  const fold = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1 },
        exit: { height: 0, opacity: 0 },
      };

  return (
    <div className="overflow-hidden rounded-[22px] bg-white">
      <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full text-left">
        <AnimatePresence initial={false}>
          {open && image && (
            <motion.span key="banner" {...fold} transition={{ duration: 0.32, ease }} className="block overflow-hidden">
              <span className="block px-2.5 pt-2.5 pb-1.5">
                <span className="relative block aspect-[2/1] overflow-hidden rounded-[16px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="" className="absolute top-1/2 left-0 w-full -translate-y-1/2" />
                </span>
              </span>
            </motion.span>
          )}
        </AnimatePresence>

        <span className="flex items-center gap-3 pt-2 pr-2 pl-3.5">
          <span className="min-w-0 flex-1 pt-1">
            <span className="block text-[15.5px] leading-tight font-medium">{title}</span>
            {/* Always mounted and sized by animation, so it shrinks in step
                with the banner instead of vanishing at the end */}
            <motion.span
              initial={false}
              animate={{ opacity: open ? 0 : 1, height: open ? 0 : "auto" }}
              transition={reduce ? { duration: 0 } : { duration: 0.32, ease }}
              className="block overflow-hidden"
              aria-hidden={open}
            >
              <span className="block truncate pt-0.5 text-[12.5px] text-crumb-muted">{sub}</span>
            </motion.span>
          </span>
          <AnimatePresence initial={false}>
            {!open && image && (
              <motion.span
                key="thumb"
                initial={reduce ? { opacity: 0 } : { opacity: 0, width: 0, height: 0 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, width: 64, height: 46 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, width: 0, height: 0 }}
                transition={{ duration: 0.28, ease }}
                className="relative block shrink-0 overflow-hidden rounded-[13px]"
                style={{ width: 64, height: 46 }}
              >
                {/* The picture stays big and is cropped by the small tile */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  className="absolute top-1/2 left-1/2 w-[105px] max-w-none -translate-x-1/2 -translate-y-1/2"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {/* Bottom padding of the closed row; it folds away when open so the
            detail sits right under the title */}
        <motion.span
          initial={false}
          animate={{ height: open ? 0 : 8 }}
          transition={reduce ? { duration: 0 } : { duration: 0.32, ease }}
          className="block"
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="detail" {...fold} transition={{ duration: 0.32, ease }} className="overflow-hidden">
            <div className="px-3.5 pb-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FoldCard({
  title,
  mark,
  open,
  onToggle,
  children,
}: {
  title: React.ReactNode;
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
