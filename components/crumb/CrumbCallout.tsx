"use client";

import { AnimatePresence, motion, useReducedMotion, type MotionValue } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import type { ReelTier, Signal, SignalKind, Thread } from "@/lib/types";
import { chipSummary, kindsInOrder, peekLines } from "@/lib/playback";
import { CrumbGlyph } from "./CrumbGlyph";
import { KindBadge, TRUST_TINT, TrustIcon } from "./SignalIcon";

// The chip and the peek card are one surface: tapping the chip grows it
// into the card (shared layoutId), so the change reads as "this opened".
// Both sit in a "double bezel": a translucent glass tray (outer shell) holding
// a cream core, so they read as objects resting on the video.

interface Props {
  mode: "hidden" | "chip" | "peek";
  tier: ReelTier;
  signals: Signal[];
  thread: Thread | undefined;
  bottom: number;
  followY: MotionValue<number>;
  onOpen: () => void;
  onClose: () => void;
  onSeeThread: () => void;
}

// Heavy, spring-like settle used across Crumb's motion.
const EASE = [0.32, 0.72, 0, 1] as const;

// Web glassmorphism approximation (not Apple Liquid Glass). Solid fallback lives in
// globals.css under prefers-reduced-transparency.
const SHELL = "crumb-glass bg-white/10 ring-1 ring-white/20 backdrop-blur-xl";
const CORE_HIGHLIGHT = "inset 0 1px 1px rgba(255,255,255,0.7)";

export function CrumbCallout({ mode, tier, signals, thread, bottom, followY, onOpen, onClose, onSeeThread }: Props) {
  const reduce = useReducedMotion();
  const layoutId = reduce ? undefined : "crumb-callout";

  return (
    <>
      {/* Screen readers hear what Crumb found as it updates, without moving focus */}
      <span role="status" aria-atomic="true" className="sr-only">
        {mode !== "hidden" && signals.length > 0 ? `Crumb found: ${chipSummary(signals, tier)}` : ""}
      </span>

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

      {/* Zero-height box on the bottom edge: moves the chip with the swipe */}
      <motion.div className="absolute inset-x-0 bottom-0 z-30 h-0" style={{ y: followY }}>
        <AnimatePresence initial={false}>
          {mode === "chip" && (
          <motion.button
            key="chip"
            type="button"
            data-interactive
            layoutId={layoutId}
            onClick={onOpen}
            aria-haspopup="dialog"
            className={`crumb-type group absolute left-2.5 z-30 flex max-w-[min(304px,calc(100%-80px))] p-1 text-crumb-ink ${SHELL}`}
            style={{ bottom: bottom - 4, borderRadius: 26 }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.26, ease: EASE }}
            aria-label={`Crumb found: ${chipSummary(signals, tier)}. Tap to see more.`}
          >
            <span
              className="flex h-11 min-w-0 items-center gap-2 rounded-[22px] bg-crumb-surface pl-2 pr-3.5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-active:scale-[0.98]"
              style={{ boxShadow: CORE_HIGHLIGHT }}
            >
              <KindDots kinds={kindsInOrder(signals)} />
              <motion.span layout="position" className="truncate text-[13px] font-medium">
                {chipSummary(signals, tier)}
              </motion.span>
            </span>
          </motion.button>
        )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence initial={false}>
        {mode === "peek" && (
          <motion.div
            key="peek"
            data-interactive
            layoutId={layoutId}
            role="dialog"
            aria-label="Crumb peek card"
            className={`crumb-type absolute left-2.5 z-50 w-[312px] p-1.5 text-crumb-ink ${SHELL}`}
            style={{ bottom: bottom - 6, borderRadius: 28 }}
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
            <div className="overflow-hidden rounded-[22px] bg-crumb-surface" style={{ boxShadow: CORE_HIGHLIGHT }}>
              <PeekBody signals={signals} thread={thread} onClose={onClose} onSeeThread={onSeeThread} />
            </div>
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
            className="flex"
          >
            <KindBadge kind={k} size={26} />
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
      className="p-3 pt-2"
    >
      <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-crumb-hairline-strong" aria-hidden />

      <div className="mb-2.5 flex items-center gap-2 px-1">
        <CrumbGlyph size={15} />
        <span className="text-[13px] font-medium">
          {signals.length} {signals.length === 1 ? "signal" : "signals"} found on this reel
        </span>
        <button
          type="button"
          onClick={onClose}
          className="-my-2 -mr-2 ml-auto flex size-11 items-center justify-center rounded-full text-crumb-muted active:bg-crumb-hairline"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* The three trust signals, kept separate: never one score */}
      <ul className="divide-y divide-black/[0.06] rounded-2xl bg-crumb-card ring-1 ring-black/[0.06]">
        {lines.map((l) => (
          <li key={l.key} className="flex items-start gap-3 px-3 py-2.5">
            <span
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-crumb-ink"
              style={{ background: TRUST_TINT[l.key] }}
            >
              <TrustIcon name={l.key} size={14} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12px] text-crumb-muted">{l.title}</span>
              <span className="block text-[14px] leading-[1.35] text-crumb-ink">{l.line}</span>
            </span>
          </li>
        ))}
      </ul>

      {friends.length > 0 && (
        <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-crumb-card px-3 py-2.5 ring-1 ring-black/[0.06]">
          <span className="flex -space-x-1.5">
            {friends.slice(0, 3).map((name, i) => (
              <span
                key={name}
                className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-crumb-ink ring-2 ring-crumb-card"
                style={{ background: FRIEND_COLOURS[i % FRIEND_COLOURS.length] }}
              >
                {name[0]}
              </span>
            ))}
          </span>
          <span className="text-[13px] leading-tight text-crumb-body">
            <span className="font-medium text-crumb-ink">
              {friends.length} {friends.length === 1 ? "person" : "people"} you know
            </span>{" "}
            reviewed this
          </span>
        </div>
      )}

      {/* Pill CTA with its arrow nested in its own circle ("button in button") */}
      <button
        type="button"
        onClick={onSeeThread}
        className="group mt-3 flex h-12 w-full items-center justify-between rounded-full bg-crumb-accent pr-1.5 pl-5 text-[14px] font-medium text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] active:bg-crumb-accent-active"
      >
        {thread ? "See the thread" : "Start a thread"}
        <span className="flex size-9 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </span>
      </button>
    </motion.div>
  );
}

const FRIEND_COLOURS = ["var(--sig-mint)", "var(--sig-blue)", "var(--sig-peach)"];
