"use client";

import { useRef } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls } from "motion/react";
import { ArrowUpRight, UsersThree, X } from "@phosphor-icons/react";
import type { CrumbStatus } from "@/lib/crumb-machine";
import type { Reel, ReelTier, Signal, Thread } from "@/lib/types";
import { CrumbGlyph } from "./CrumbGlyph";
import { CountTag } from "./Findings";
import { inkStyle } from "./SignalIcon";
import { FlagIcon } from "./FlagIcon";
import { illustrationFor } from "./illustrations";
import { avatarFor } from "@/lib/avatars";

// One widget does everything Crumb says. It sits above the creator row:
//   scanning  the rim glow is alive (Figma "Widget glowing - detecting")
//   a flag    the circle stretches into a chip, holds, folds back with a badge
//   tap       morphs into the peek card (or "Nothing flagged yet")
//   hold      turns Crumb off; it slides out left, leaving a slim tab
//   tab       swipe it right (or tap) to bring Crumb back

const SIZE = 46;
// Hold to turn off: nothing shows for a normal tap; the ring only appears
// once the finger has stayed down a moment, then fills.
export const HOLD_DELAY_MS = 300;
export const HOLD_MS = 800;
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
  facts: { bg: "#F5A623", fg: "#FFFFFF" },
};


interface Props {
  status: CrumbStatus;
  open: boolean;
  announcing: Signal | null;
  aside?: Reel["aside"] | null; // a just-for-fun chip, not a flag
  found: Signal[];
  shown?: number; // flags already announced (the badge); defaults to all found
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
              found={found.length ? found.slice(0, Math.max(1, props.shown ?? found.length)) : found}
              reel={reel}
              thread={thread}
              onClose={props.onClose}
              onSeeThread={props.onSeeThread}
            />
          ) : (
            <Widget
              key="widget"
              layoutId={layoutId}
              glowMode={off ? "none" : glowMode}
              glowKey={props.shown ?? found.length}
              tone={tone}
              badge={status === "signals" && !chip && (props.shown ?? found.length) > 0 ? { count: props.shown ?? found.length, ...BADGE[flagTone] } : null}
              chip={chip}
              disabled={off || hidden}
              onTap={glowMode === "scanning" ? () => {} : props.onOpen}
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
              data-tutorial="tab"
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
  const press = useRef<{ x: number; y: number; timers: ReturnType<typeof setTimeout>[]; anim?: AnimationPlaybackControls } | null>(null);
  const held = useRef(false);

  const cancelHold = () => {
    if (!press.current) return;
    press.current.timers.forEach(clearTimeout);
    press.current.anim?.stop();
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
          const p: NonNullable<typeof press.current> = { x: e.clientX, y: e.clientY, timers: [] };
          press.current = p;
          // A normal tap lifts before this fires, so it never shows the ring.
          p.timers.push(
            setTimeout(() => {
              p.anim = animate(progress, 1, { duration: HOLD_MS / 1000, ease: "linear" });
              p.timers.push(
                setTimeout(() => {
                  held.current = true;
                  press.current = null;
                  // Stop the fill first: if its last frame lands after the reset,
                  // the ring stays drawn around the widget when Crumb comes back.
                  p.anim?.stop();
                  progress.jump(0);
                  onHold();
                  // Phones don't always send a click after a long press; never let a
                  // stale flag swallow the next real tap.
                  setTimeout(() => (held.current = false), 600);
                }, HOLD_MS),
              );
            }, HOLD_DELAY_MS),
          );
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
        data-tutorial="widget"
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
              ) : chip.kind ? (
                <FlagIcon mark={chip.kind} size={19} />
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
  onClose,
  onSeeThread,
}: {
  layoutId?: string;
  found: Signal[];
  reel: Reel;
  thread: Thread | undefined;
  onClose: () => void;
  onSeeThread: () => void;
}) {
  const empty = found.length === 0;
  const facts = reel.tier !== "flag";
  const lead = found[0];

  return (
    <motion.div
      layoutId={layoutId}
      role="dialog"
      aria-label={empty ? "Nothing flagged yet" : "What Crumb found"}
      className="crumb-type absolute bottom-0 left-0 overflow-hidden text-crumb-ink"
      style={{ width: empty ? "min(320px, calc(100vw - 24px))" : "min(366px, calc(100vw - 24px))", borderRadius: 28, background: "#FFFFFF" }}
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
          // Figma "peek card no flag" (1470-492): the empty box with the bread
          // logo and × over it, then what Crumb has (not) found.
          <div className="relative p-3 pb-5">
            {/* The whole picture, a little smaller than the card, centred; its own
                white margin gives the breathing room */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/nothing-flagged.webp" alt="" className="mx-auto mt-1 block w-[85%]" />
            <span
              className="absolute top-3 left-3 flex size-11 items-center justify-center rounded-full"
              style={{ background: SURFACE }}
              aria-hidden
            >
              <CrumbGlyph size={24} body="#0A0A0A" face={SURFACE} />
            </span>
            <span className="absolute top-3 right-2">
              <CloseButton onClose={onClose} />
            </span>
            <p className="relative -mt-10 px-2 text-[19px] leading-tight font-medium tracking-[-0.015em]">Nothing flagged yet</p>
            <p className="mt-1.5 px-2 text-[14.5px] leading-snug text-crumb-body">
              Crumb hasn&apos;t found money or health-claim signals in this reel so far.
            </p>
          </div>
        ) : (
          // Figma "peek card new" (1482-826): what Crumb found as one picture
          // and one line, who you know, and the way to the thread. The full
          // list of flags lives on the thread.
          <div className="p-3" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2 pl-1.5">
              <p className="flex items-center gap-2 text-[15.5px] font-medium tracking-[-0.01em]">
                <CrumbGlyph size={20} />
                {facts ? "Crumb noticed" : "Crumb found"}
              </p>
              <span className="flex shrink-0 items-center gap-1">
                <CountTag tier={reel.tier} count={found.length} />
                <CloseButton onClose={onClose} />
              </span>
            </div>

            {lead && illustrationFor(lead) && (
              <span className="relative mt-2.5 block aspect-[15/8] overflow-hidden rounded-[18px]">
                {/* The first flag's picture */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={illustrationFor(lead)} alt="" className="absolute top-1/2 left-0 w-full -translate-y-1/2" />
              </span>
            )}

            {lead && (
              <p className="mt-3 px-1.5 text-[16.5px] leading-snug tracking-[-0.01em] text-crumb-body">
                <span className="signal-ink on-light font-medium" style={inkStyle(lead.kind, "light")}>
                  {lead.label}
                </span>
                {moreText(found, facts)}
              </p>
            )}

            {thread && <PeopleRow thread={thread} />}

            <button
              type="button"
              onClick={onSeeThread}
              className="mt-3 flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-crumb-ink text-[15px] font-medium text-white active:opacity-85"
            >
              {thread ? "See the thread" : "Start a thread"} <ArrowUpRight size={17} />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// After the first flag's name: " and 2 more flags" (amber reels: " and 2 more").
function moreText(found: Signal[], facts: boolean): string {
  const more = found.length - 1;
  if (more <= 0) return "";
  return ` and ${more} more${facts ? "" : more === 1 ? " flag" : " flags"}`;
}

// Who you know reviewed it.
function PeopleRow({ thread }: { thread: Thread }) {
  const names = thread.friendNames;
  return (
    <div className="mt-2.5 flex items-center gap-3 px-1.5">
      {names.length > 0 ? (
        <span className="flex shrink-0 -space-x-2.5">
          {names.slice(0, 3).map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} src={avatarFor(n)} alt="" className="size-8 rounded-full object-cover ring-2 ring-white" />
          ))}
        </span>
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-crumb-surface text-crumb-body">
          <UsersThree size={18} weight="duotone" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] leading-snug text-crumb-body">
          {names.length > 0 ? `${joinNames(names)} reviewed this` : "No one you know has reviewed this"}
        </p>
      </div>
    </div>
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      data-tutorial="close"
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
