"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import type { Signal, SignalKind, Thread } from "@/lib/types";
import { chipSummary, kindsInOrder, peekLines } from "@/lib/playback";
import { CrumbGlyph } from "./CrumbGlyph";
import { SignalIcon, TrustIcon } from "./SignalIcon";

// The chip and the peek card are one surface: tapping the chip grows it
// into the card (shared layoutId), so the change reads as "this opened".

interface Props {
  mode: "hidden" | "chip" | "peek";
  signals: Signal[];
  thread: Thread | undefined;
  bottom: number;
  onOpen: () => void;
  onClose: () => void;
  onSeeThread: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function CrumbCallout({ mode, signals, thread, bottom, onOpen, onClose, onSeeThread }: Props) {
  const reduce = useReducedMotion();
  const layoutId = reduce ? undefined : "crumb-callout";

  return (
    <>
      {/* Tap outside to dismiss the peek card */}
      <AnimatePresence>
        {mode === "peek" && (
          <motion.div
            key="peek-scrim"
            data-interactive
            className="absolute inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {mode === "chip" && (
          <motion.button
            key="chip"
            type="button"
            data-interactive
            layoutId={layoutId}
            onClick={onOpen}
            className="absolute left-3.5 z-30 flex h-10 max-w-[min(300px,calc(100%-84px))] items-center gap-2 bg-crumb-surface pl-1.5 pr-3.5 text-crumb-ink"
            style={{ bottom, borderRadius: 20, boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.26, ease: EASE }}
            aria-label={`Crumb found: ${chipSummary(signals)}. Tap to see more.`}
          >
            <KindDots kinds={kindsInOrder(signals)} />
            <motion.span layout="position" className="truncate text-[13px] font-semibold tracking-tight">
              {chipSummary(signals)}
            </motion.span>
          </motion.button>
        )}

        {mode === "peek" && (
          <motion.div
            key="peek"
            data-interactive
            layoutId={layoutId}
            role="dialog"
            aria-label="Crumb peek card"
            className="absolute left-3.5 z-50 w-[304px] overflow-hidden bg-crumb-surface text-crumb-ink"
            style={{ bottom, borderRadius: 26, boxShadow: "0 18px 50px rgba(0,0,0,0.45)" }}
            initial={reduce ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, transition: { duration: 0.18 } }}
            transition={{ duration: 0.32, ease: EASE }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 70 || info.velocity.y > 400) onClose();
            }}
          >
            <PeekBody signals={signals} thread={thread} onClose={onClose} onSeeThread={onSeeThread} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function KindDots({ kinds }: { kinds: SignalKind[] }) {
  return (
    <span className="flex items-center gap-1">
      <AnimatePresence initial={false}>
        {kinds.slice(0, 3).map((k) => (
          <motion.span
            key={k}
            layout
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="flex size-7 items-center justify-center rounded-full bg-crumb-tint text-crumb-deep"
          >
            <SignalIcon kind={k} />
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}

function PeekBody({
  signals,
  thread,
  onClose,
  onSeeThread,
}: {
  signals: Signal[];
  thread: Thread | undefined;
  onClose: () => void;
  onSeeThread: () => void;
}) {
  const lines = peekLines(signals, thread);
  const friends = thread?.friendNames ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }}
      className="p-4 pt-2.5"
    >
      <div className="mx-auto mb-2.5 h-1 w-9 rounded-full bg-black/15" aria-hidden />

      <div className="mb-3 flex items-center gap-2">
        <CrumbGlyph size={16} />
        <span className="text-[13px] font-semibold tracking-tight">
          {signals.length} {signals.length === 1 ? "signal" : "signals"} found on this reel
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex size-7 items-center justify-center rounded-full text-crumb-muted active:bg-black/5"
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        {lines.map((l) => (
          <li key={l.key} className="flex items-start gap-3">
            <span
              className={
                "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full " +
                (l.key === "community" ? "bg-black/[0.06] text-crumb-ink" : "bg-crumb-tint text-crumb-deep")
              }
            >
              <TrustIcon name={l.key} />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-crumb-muted">{l.title}</span>
              <span className="block text-[14px] leading-[1.25] font-medium tracking-tight">{l.line}</span>
            </span>
          </li>
        ))}
      </ul>

      {friends.length > 0 && (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5">
          <span className="flex -space-x-2">
            {friends.slice(0, 3).map((name, i) => (
              <span
                key={name}
                className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-white"
                style={{ background: FRIEND_COLOURS[i % FRIEND_COLOURS.length] }}
              >
                {name[0]}
              </span>
            ))}
          </span>
          <span className="text-[13px] font-medium leading-tight tracking-tight">
            {friends.length} {friends.length === 1 ? "person" : "people"} you know reviewed this
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onSeeThread}
        className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-crumb-ink text-[14px] font-semibold text-white active:opacity-85"
      >
        {thread ? "See the thread" : "Start a thread"}
        <ArrowUpRight size={16} strokeWidth={2.4} />
      </button>
    </motion.div>
  );
}

const FRIEND_COLOURS = ["#5B7CFA", "#E0884A", "#3FA37A"];
