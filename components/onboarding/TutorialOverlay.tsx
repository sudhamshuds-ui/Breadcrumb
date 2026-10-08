"use client";

import { useEffect, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TUTORIAL_COPY, TUTORIAL_STEPS, type TutorialStep } from "@/lib/onboarding";
import { GhostHand } from "./GhostHand";

// The first-run tutorial drawn over the reel: a coach card that says what to
// try, and a ghost hand looping the gesture on the real control. Controls are
// found by their `data-tutorial` attribute, so the hand follows them exactly
// (the chip's width, the card's height) without hard-coded positions.

export function TutorialOverlay({
  step,
  frameRef,
  coachBottom,
  onStart,
  onSkip,
}: {
  step: TutorialStep;
  frameRef: RefObject<HTMLDivElement | null>;
  coachBottom: number; // where the coach card sits when it's above Crumb
  onStart: () => void; // the welcome card's button: sound on, reel plays
  onSkip: () => void;
}) {
  const copy = step === "finished" ? null : TUTORIAL_COPY[step];
  const point = useTargetPoint(frameRef, copy?.target ?? null);
  const dot = TUTORIAL_STEPS.indexOf(step);

  return (
    <>
      {/* Until the last stage, only Crumb responds: the reel's own buttons
          and the feed wait (the widget, its card and tab sit above this). */}
      {step !== "finished" && step !== "done" && <div data-interactive className="absolute inset-0 z-[25]" />}

      <AnimatePresence mode="wait">
        {copy && (
          <motion.div
            key={step}
            role="status"
            aria-live="polite"
            className="crumb-type absolute inset-x-3 z-[45] rounded-[22px] bg-white px-4 pt-3 pb-3.5 text-crumb-ink shadow-[0_8px_28px_rgba(0,0,0,0.28)]"
            style={
              copy.coach === "top"
                ? { top: "calc(var(--top-inset) + 52px)" }
                : copy.coach === "center"
                  ? { top: "38%" }
                  : { bottom: coachBottom }
            }
            initial={{ opacity: 0, y: copy.coach === "top" ? -8 : 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.24, delay: 0.15 } }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex gap-1" aria-label={dot < 0 ? undefined : `Step ${dot + 1} of ${TUTORIAL_STEPS.length}`}>
                {dot >= 0 && TUTORIAL_STEPS.map((s, i) => (
                  <span
                    key={s}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === dot ? 16 : 6, background: i <= dot ? "#26251E" : "#D9D6CE" }}
                  />
                ))}
              </span>
              {step === "done" ? (
                <button
                  type="button"
                  data-interactive
                  onClick={onSkip}
                  className="-my-1 h-9 rounded-full bg-crumb-ink px-4 text-[14px] font-medium text-white active:opacity-85"
                >
                  Got it
                </button>
              ) : (
                <button
                  type="button"
                  data-interactive
                  onClick={onSkip}
                  className="-my-1.5 -mr-2 h-9 rounded-full px-3 text-[13px] font-medium text-crumb-muted active:bg-crumb-hairline"
                >
                  Skip tutorial
                </button>
              )}
            </div>
            <p className="mt-2 text-[16px] leading-tight font-medium tracking-[-0.01em]">{copy.title}</p>
            <p className="mt-1 text-[13.5px] leading-snug text-crumb-body">
              <Inked text={copy.body} />
            </p>
            {step === "intro" && (
              <button
                type="button"
                data-interactive
                onClick={onStart}
                className="mt-3 h-11 w-full rounded-full bg-crumb-ink text-[15px] font-medium text-white active:opacity-85"
              >
                Start with sound
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {copy?.gesture && point && <GhostHand key={step} gesture={copy.gesture} x={point.x} y={point.y} />}
    </>
  );
}

// Crumb's own ink for the words to act on: the scan glow's mint and blue,
// deepened for the white card, flowing like the caption highlights.
const CRUMB_INK = { ["--ink" as string]: "#0B8A5C", ["--ink2" as string]: "#1845D9" };

function Inked({ text }: { text: string }) {
  return text.split(/\*(.+?)\*/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="signal-ink on-light font-semibold" style={CRUMB_INK}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// Where the hand's fingertip goes, in the frame's own pixels. Polled, because
// the targets animate into place (the card springs open, the tab slides in).
function useTargetPoint(frameRef: RefObject<HTMLDivElement | null>, target: string | null) {
  // Tagged with its target, so a new stage never borrows the last one's spot.
  const [point, setPoint] = useState<{ target: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!target) return;
    const measure = () => {
      const frame = frameRef.current;
      if (!frame) return;
      const box = frame.getBoundingClientRect();
      const scale = box.height / frame.offsetHeight || 1; // the desktop frame may be scaled
      if (target === "feed") {
        setPoint({ target, x: frame.offsetWidth / 2, y: frame.offsetHeight * 0.66 });
        return;
      }
      const el = frame.querySelector(`[data-tutorial="${target}"]`);
      if (!el) return setPoint(null);
      const r = el.getBoundingClientRect();
      // Chips and the circle: aim at the circle end, where a thumb would land.
      const x = target === "widget" ? r.left + Math.min(r.width / 2, 23 * scale) : r.left + r.width / 2;
      const next = { target, x: (x - box.left) / scale, y: (r.top + r.height / 2 - box.top) / scale };
      setPoint((p) => (p && p.target === target && Math.abs(p.x - next.x) < 1 && Math.abs(p.y - next.y) < 1 ? p : next));
    };
    const first = requestAnimationFrame(measure);
    const id = setInterval(measure, 150);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(id);
    };
  }, [frameRef, target]);

  return point && point.target === target ? point : null;
}
