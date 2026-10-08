"use client";

import { useRef } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import type { CrumbStatus } from "@/lib/crumb-machine";
import type { Reel, ReelTier, Signal, Thread } from "@/lib/types";
import { KIND_EMOJI, type IconStyle } from "@/lib/icon-style";
import { CrumbGlyph } from "./CrumbGlyph";
import { SignalIcon, useIconStyle } from "./SignalIcon";
import { CommunityRow, CountTag, FindingsList } from "./Findings";

// One widget does everything Crumb says. It sits above the creator row:
//   scanning  the rim glow is alive (Figma "Widget glowing - detecting")
//   a flag    the circle stretches into a chip, holds, folds back with a badge
//   tap       morphs into the peek card (or "Nothing flagged yet")
//   hold      turns Crumb off; it slides out left, leaving a slim tab
//   tab       swipe it right (or tap) to bring Crumb back

const SIZE = 46;
const HOLD_MS = 650;
const SURFACE = "#EDEDED";
const SPRING = { type: "spring", stiffness: 420, damping: 36 } as const;

type Tone = { g1: string; g2: string; g3: string; g4: string; ring: string };

// Colours from the Figma glow layers. Flags on "facts" reels use amber, not red.
const TONES: Record<"scan" | "flag" | "facts", Tone> = {
  scan: { g1: "#42FA9C", g2: "#00BAFF", g3: "#1845D9", g4: "#B1FFD7", ring: "#90ECD5" },
  flag: { g1: "#FFA0A0", g2: "#F04A4A", g3: "#B50534", g4: "#FF9AB4", ring: "#FF8A8A" },
  facts: { g1: "#FFE6A0", g2: "#FFB21E", g3: "#C66A00", g4: "#FFF1C6", ring: "#FFD27A" },
};
const BADGE = {
  flag: { bg: "#F64444", fg: "#FFFFFF" },
  facts: { bg: "#F5A623", fg: "#26251E" },
};


interface Props {
  status: CrumbStatus;
  open: boolean;
  announcing: Signal | null;
  aside?: Reel["aside"] | null; // a just-for-fun chip, not a flag
  found: Signal[];
  reel: Reel;
  thread: Thread | undefined;
  bottom: number;
  hidden: boolean; // a sheet covers the bottom of the screen
  dimmed: boolean; // the reel is held paused
  onOpen: () => void;
  onClose: () => void;
  onTurnOff: () => void;
  onTurnOn: () => void;
  onSeeThread: () => void;
  morphId?: string; // unique per widget on screen (the /states board shows several)
}

export function CrumbWidget(props: Props) {
  const { status, open, announcing, found, reel, thread, bottom, hidden, dimmed } = props;
  // What the chip shows: a flag, or the reel's just-for-fun aside.
  const chip = announcing
    ? { key: announcing.id, kind: announcing.kind, emoji: undefined, label: announcing.label }
    : props.aside
      ? { key: "aside", kind: undefined, emoji: props.aside.emoji, label: props.aside.label ?? "" }
      : null;
  const reduce = useReducedMotion();
  const iconStyle = useIconStyle();
  const off = status === "off";
  const flagTone = reel.tier === "flag" ? "flag" : "facts";
  // No glow while a flag is shown as a chip: one thing moves at a time. The
  // flagged glow blooms as the chip folds back into the circle.
  const glowMode = chip ? "none" : status === "scanning" ? "scanning" : status === "signals" ? "flagged" : "none";
  const tone = TONES[status === "signals" ? flagTone : "scan"];
  const layoutId = reduce ? undefined : `crumb-surface${props.morphId ?? ""}`;

  return (
    <>
      {/* Screen-reader voice for what the widget shows */}
      <span role="status" aria-live="polite" className="sr-only">
        {announcing ? `Crumb flagged: ${announcing.label}` : ""}
      </span>

      {/* Tap outside the card to close it */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="crumb-scrim"
            data-interactive
            className="absolute inset-0 z-[39] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={props.onClose}
          />
        )}
      </AnimatePresence>

      <motion.div
        data-interactive
        className={"absolute left-3 " + (open ? "z-40" : "z-30")}
        style={{ bottom }}
        initial={false}
        animate={{ x: off ? -SIZE - 40 : 0, opacity: hidden ? 0 : dimmed ? 0.4 : 1 }}
        transition={off ? { type: "spring", stiffness: 260, damping: 30 } : SPRING}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {open ? (
            <Card
              key="card"
              layoutId={layoutId}
              found={found}
              reel={reel}
              thread={thread}
              iconStyle={iconStyle}
              onClose={props.onClose}
              onSeeThread={props.onSeeThread}
            />
          ) : (
            <Widget
              key="widget"
              layoutId={layoutId}
              glowMode={off ? "none" : glowMode}
              glowKey={found.length}
              tone={tone}
              badge={status === "signals" && !chip ? { count: found.length, ...BADGE[flagTone] } : null}
              chip={chip}
              iconStyle={iconStyle}
              disabled={off || hidden}
              onTap={props.onOpen}
              onHold={props.onTurnOff}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Crumb is off: a slim tab at the left edge brings it back */}
      <AnimatePresence>
        {off && !hidden && (
          <motion.div
            key="crumb-tab"
            data-interactive
            role="button"
            tabIndex={0}
            aria-label="Turn Crumb back on"
            className="absolute left-0 z-30 flex h-[64px] w-[34px] items-center"
            style={{ bottom: bottom - 5 }}
            initial={{ x: -34 }}
            animate={{ x: 0, transition: { delay: 0.3, ...SPRING } }}
            exit={{ x: -34, transition: { duration: 0.15 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.9 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 28 || info.velocity.x > 300) props.onTurnOn();
            }}
            onTap={props.onTurnOn}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") props.onTurnOn();
            }}
          >
            <span
              className="flex h-[48px] w-[14px] items-center justify-center rounded-r-full"
              style={{ background: SURFACE, boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}
            >
              <span className="h-[18px] w-[3px] rounded-full bg-black/25" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------

function Widget({
  layoutId,
  glowMode,
  glowKey,
  tone,
  badge,
  chip,
  iconStyle,
  disabled,
  onTap,
  onHold,
}: {
  layoutId?: string;
  glowMode: "scanning" | "flagged" | "none";
  glowKey: number;
  tone: Tone;
  badge: { count: number; bg: string; fg: string } | null;
  chip: { key: string; kind?: Signal["kind"]; emoji?: string; label: string } | null;
  iconStyle: IconStyle;
  disabled: boolean;
  onTap: () => void;
  onHold: () => void;
}) {
  // The last visible glow mode, so a fading glow keeps moving while it fades.
  const lastMode = useRef<"scanning" | "flagged">("scanning");
  if (glowMode !== "none") lastMode.current = glowMode;
  const fadeQuick = Boolean(chip);

  const progress = useMotionValue(0);
  const ringOpacity = useTransform(progress, [0, 0.05], [0, 1]);
  const press = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout>; anim: AnimationPlaybackControls } | null>(null);
  const held = useRef(false);

  const cancelHold = () => {
    if (!press.current) return;
    clearTimeout(press.current.timer);
    press.current.anim.stop();
    press.current = null;
    animate(progress, 0, { duration: 0.18 });
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Press and hold anywhere on the widget to turn Crumb off. A plain
          element listens, because motion consumes raw pointer events on its
          own animated elements. Moving the finger cancels the hold. */}
      <div
        onPointerDown={(e) => {
          if (disabled) return;
          held.current = false;
          const anim = animate(progress, 1, { duration: HOLD_MS / 1000, ease: "linear" });
          const timer = setTimeout(() => {
            held.current = true;
            press.current = null;
            progress.set(0);
            onHold();
            // Phones don't always send a click after a long press; never let a
            // stale flag swallow the next real tap.
            setTimeout(() => (held.current = false), 600);
          }, HOLD_MS);
          press.current = { x: e.clientX, y: e.clientY, timer, anim };
        }}
        onPointerMove={(e) => {
          const p = press.current;
          if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) cancelHold();
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onPointerLeave={cancelHold}
      >
      {/* Glow and hold ring sit behind/around the circle end of the widget */}
      <div className="pointer-events-none absolute top-0 left-0" style={{ width: SIZE, height: SIZE }}>
        <div
          key={glowMode === "flagged" ? `f${glowKey}` : "glow"}
          className="crumb-glow"
          data-mode={glowMode === "none" ? lastMode.current : glowMode}
          style={{
            opacity: glowMode === "none" ? 0 : 1,
            // Settling after a scan: a slow, soft fade. Making way for a chip: quick.
            transition: glowMode === "none" ? `opacity ${fadeQuick ? 0.2 : 1.6}s cubic-bezier(0.4, 0, 0.2, 1)` : "opacity 0.5s ease",
            ["--g1" as string]: tone.g1,
            ["--g2" as string]: tone.g2,
            ["--g3" as string]: tone.g3,
            ["--g4" as string]: tone.g4,
            ["--ring" as string]: tone.ring,
          }}
        >
          <div className="breathe">
            <div className="orbit o1"><span className="blob" /></div>
            <div className="orbit o2"><span className="blob" /></div>
            <div className="orbit o3"><span className="blob" /></div>
          </div>
          <span className="ring" />
        </div>
        <motion.svg className="crumb-hold-ring" viewBox="0 0 64 64" style={{ opacity: ringOpacity }} aria-hidden>
          <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
          <motion.circle cx="32" cy="32" r="30" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" style={{ pathLength: progress }} />
        </motion.svg>
      </div>

      <motion.button
        type="button"
        layout
        layoutId={layoutId}
        disabled={disabled}
        aria-label={chip ? `Crumb: ${chip.label || "just for fun"}. Tap for details.` : "Crumb. Tap to see what it found, hold to turn off."}
        className="relative flex items-center overflow-hidden text-crumb-ink outline-offset-4 select-none"
        style={{ height: SIZE, minWidth: SIZE, borderRadius: SIZE / 2, background: SURFACE }}
        transition={SPRING}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => {
          // A hold already turned Crumb off: swallow the click that follows.
          if (held.current) {
            held.current = false;
            return;
          }
          onTap();
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!chip && (
            <motion.span
              key="logo"
              layout="position"
              className="flex shrink-0 items-center justify-center"
              style={{ width: SIZE, height: SIZE }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.1, duration: 0.2 } }}
              exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.12 } }}
            >
              <CrumbGlyph size={26} body="#0A0A0A" face={SURFACE} />
            </motion.span>
          )}
          {chip && (
            <motion.span
              key={chip.key}
              layout="position"
              className="crumb-type flex items-center gap-2 px-4 text-[14px] font-medium whitespace-nowrap"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.08, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              {chip.emoji ? (
                <span className={chip.label ? "text-[16px] leading-none" : "text-[20px] leading-none tracking-[0.04em]"} aria-hidden>
                  {chip.emoji}
                </span>
              ) : chip.kind && iconStyle === "emoji" ? (
                <span className="text-[16px] leading-none" aria-hidden>{KIND_EMOJI[chip.kind]}</span>
              ) : chip.kind ? (
                <SignalIcon kind={chip.kind} size={15} />
              ) : null}
              {chip.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      </div>

      <AnimatePresence>
        {badge && (
          <motion.span
            key="badge"
            className="crumb-type pointer-events-none absolute flex items-center justify-center rounded-full text-[11.5px] font-semibold tabular-nums"
            style={{ top: -4, left: SIZE - 15, minWidth: 20, height: 20, padding: "0 4px", background: badge.bg, color: badge.fg, boxShadow: `0 0 0 2px ${SURFACE}` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 24 }}
          >
            <motion.span key={badge.count} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              {badge.count}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function Card({
  layoutId,
  found,
  reel,
  thread,
  iconStyle,
  onClose,
  onSeeThread,
}: {
  layoutId?: string;
  found: Signal[];
  reel: Reel;
  thread: Thread | undefined;
  iconStyle: IconStyle;
  onClose: () => void;
  onSeeThread: () => void;
}) {
  const empty = found.length === 0;
  const facts = reel.tier !== "flag";

  return (
    <motion.div
      layoutId={layoutId}
      role="dialog"
      aria-label={empty ? "Nothing flagged yet" : "What Crumb found"}
      className="crumb-type absolute bottom-0 left-0 overflow-hidden bg-white text-crumb-ink"
      style={{ width: empty ? 300 : "min(366px, calc(100vw - 24px))", borderRadius: 28 }}
      transition={SPRING}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 70 || info.velocity.y > 450) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }}
        exit={{ opacity: 0, transition: { duration: 0.08 } }}
      >
        {empty ? (
          <div className="flex items-start gap-3 p-4 pr-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ background: SURFACE }}>
              <CrumbGlyph size={22} body="#0A0A0A" face={SURFACE} />
            </span>
            <div className="pt-0.5">
              <p className="text-[16px] font-medium tracking-[-0.01em]">Nothing flagged yet</p>
              <p className="mt-1 text-[13.5px] leading-snug text-crumb-body">
                Crumb hasn&apos;t found money or health-claim signals in this reel so far.
              </p>
            </div>
            <CloseButton onClose={onClose} />
          </div>
        ) : (
          <div className="max-h-[min(520px,66vh)] overflow-y-auto overscroll-contain p-3" onPointerDown={(e) => e.stopPropagation()}>
            {/* What Crumb found (who posted it is already on the reel) */}
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="flex items-center gap-2 text-[16px] font-medium tracking-[-0.01em]">
                <CrumbGlyph size={20} />
                {facts ? "Crumb noticed" : "Crumb found"}
              </p>
              <span className="flex shrink-0 items-center gap-1">
                <CountTag tier={reel.tier} count={found.length} />
                <CloseButton onClose={onClose} />
              </span>
            </div>

            {/* Everything flagged, evidence as one more signal, then people */}
            <FindingsList found={found} thread={thread} iconStyle={iconStyle} className="mt-2.5" />
            {thread && <CommunityRow thread={thread} iconStyle={iconStyle} className="mt-2" />}

            <button
              type="button"
              onClick={onSeeThread}
              className="mt-2.5 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-crumb-ink text-[15px] font-medium text-white active:opacity-85"
            >
              {thread ? "See the thread" : "Start a thread"} <ArrowUpRight size={17} />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="-my-1 flex size-9 shrink-0 items-center justify-center rounded-full text-crumb-body active:bg-crumb-hairline"
    >
      <X size={18} />
    </button>
  );
}

// ---------------------------------------------------------------------------

// The widget in miniature, for places where the full one is hidden (the
// caption sheet): same circle, logo, tier rim and count badge. Tap = peek card.
export function CrumbMini({ tier, count, onTap }: { tier: ReelTier; count: number; onTap: () => void }) {
  const toneKey = tier === "flag" ? "flag" : "facts";
  const tone = TONES[toneKey];
  const badge = BADGE[toneKey];
  const size = 36;
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Crumb ${tier === "flag" ? "found" : "noticed"} ${count} ${count === 1 ? "thing" : "things"}. Tap to see.`}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <div
        className="crumb-glow"
        data-mode="flagged"
        style={{
          ["--g1" as string]: tone.g1,
          ["--g2" as string]: tone.g2,
          ["--g3" as string]: tone.g3,
          ["--g4" as string]: tone.g4,
          ["--ring" as string]: tone.ring,
        }}
      >
        <div className="breathe">
          <div className="orbit o1"><span className="blob" /></div>
          <div className="orbit o2"><span className="blob" /></div>
          <div className="orbit o3"><span className="blob" /></div>
        </div>
      </div>
      <span className="relative flex size-full items-center justify-center rounded-full" style={{ background: SURFACE }}>
        <CrumbGlyph size={20} body="#0A0A0A" face={SURFACE} />
      </span>
      <span
        className="crumb-type absolute flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
        style={{ top: -5, left: size - 13, minWidth: 18, height: 18, padding: "0 4px", background: badge.bg, color: badge.fg, boxShadow: `0 0 0 2px ${SURFACE}` }}
      >
        {count}
      </span>
    </button>
  );
}
