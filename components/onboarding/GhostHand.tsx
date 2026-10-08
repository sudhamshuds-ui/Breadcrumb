"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Gesture } from "@/lib/onboarding";

// A see-through "ghost" hand that loops a gesture over the real control, so
// the tester sees what to do and then does it themselves. The fingertip sits
// exactly on the anchor point (x, y), in the frame's own pixels.

const W = 70; // drawn width; the hand is 100 x 140 in its own units
const SCALE = W / 100;
const TIP = { x: 34 * SCALE, y: 4 * SCALE };

// Each gesture's loop, as fractions of its duration: the finger lands at
// `press`, lifts at `release`, and travels by `move` in between.
const LOOPS: Record<Gesture, { dur: number; press: number; release: number; move: { x: number; y: number } }> = {
  tap: { dur: 1.6, press: 0.35, release: 0.5, move: { x: 0, y: 0 } },
  hold: { dur: 2.6, press: 0.2, release: 0.78, move: { x: 0, y: 0 } },
  "swipe-right": { dur: 2.1, press: 0.25, release: 0.72, move: { x: 70, y: 0 } },
  "swipe-up": { dur: 2.2, press: 0.25, release: 0.72, move: { x: 0, y: -130 } },
};

export function GhostHand({ gesture, x, y }: { gesture: Gesture; x: number; y: number }) {
  const reduce = useReducedMotion();
  const { dur, press: a, release: b, move } = LOOPS[gesture];
  const loop = { duration: dur, repeat: Infinity, repeatDelay: 0.15, ease: "easeInOut" as const };

  // in → land → (travel) → lift → out
  const times = [0, a - 0.15, a, a + 0.06, b - 0.06, b, b + 0.2, 1];
  const xs = [10, 0, 0, 0, move.x, move.x, move.x + 6, move.x + 6];
  const ys = [16, 0, 0, 0, move.y, move.y, move.y + 10, move.y + 10];

  return (
    <div className="pointer-events-none absolute z-[46]" style={{ left: x, top: y, width: 0, height: 0 }} aria-hidden>
      {/* Hold: the ring fills like the real one (after a short beat) */}
      {gesture === "hold" && !reduce && (
        <svg className="absolute" style={{ left: -32, top: -32, width: 64, height: 64, transform: "rotate(-90deg)" }} viewBox="0 0 64 64">
          <motion.circle
            cx="32"
            cy="32"
            r="30"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 0, 0, 1, 1, 1], opacity: [0, 0, 1, 1, 0, 0] }}
            transition={{ ...loop, ease: "linear", times: [0, a + 0.11, a + 0.115, b - 0.02, b + 0.04, 1] }}
          />
        </svg>
      )}

      {/* Swipe: a soft trail from where the finger landed */}
      {(gesture === "swipe-right" || gesture === "swipe-up") && !reduce && (
        <motion.span
          className="absolute rounded-full"
          style={
            gesture === "swipe-right"
              ? { left: 0, top: -3, width: move.x, height: 6, transformOrigin: "0% 50%", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75))" }
              : { left: -3, top: move.y, width: 6, height: -move.y, transformOrigin: "50% 100%", background: "linear-gradient(0deg, rgba(255,255,255,0), rgba(255,255,255,0.75))" }
          }
          initial={{ opacity: 0 }}
          animate={
            gesture === "swipe-right"
              ? { scaleX: [0, 0, 0, 1, 1, 1], opacity: [0, 0, 0.9, 0.9, 0, 0] }
              : { scaleY: [0, 0, 0, 1, 1, 1], opacity: [0, 0, 0.9, 0.9, 0, 0] }
          }
          transition={{ ...loop, times: [0, a, a + 0.06, b - 0.06, b + 0.14, 1] }}
        />
      )}

      {/* Tap: a ripple where the finger lands */}
      {gesture === "tap" && !reduce && (
        <motion.span
          className="absolute rounded-full border-2 border-white"
          style={{ left: -22, top: -22, width: 44, height: 44 }}
          initial={{ opacity: 0 }}
          animate={{ scale: [0.4, 0.4, 1.7, 1.7], opacity: [0, 0.95, 0, 0] }}
          transition={{ ...loop, ease: "easeOut", times: [0, a, a + 0.4, 1] }}
        />
      )}

      {/* The touch point under the fingertip, and the hand itself */}
      <motion.div
        className="absolute"
        style={{ left: 0, top: 0 }}
        initial={reduce ? false : { opacity: 0, x: xs[0], y: ys[0] }}
        animate={reduce ? { opacity: 1 } : { x: xs, y: ys, opacity: [0, 1, 1, 1, 1, 1, 0.9, 0] }}
        transition={reduce ? { duration: 0.2 } : { ...loop, times }}
      >
        <motion.span
          className="absolute rounded-full bg-white"
          style={{ left: -13, top: -13, width: 26, height: 26 }}
          initial={{ opacity: 0 }}
          animate={reduce ? { opacity: 0.35 } : { opacity: [0, 0, 0.45, 0.45, 0.45, 0, 0, 0], scale: [0.5, 0.5, 1, 1, 1, 0.5, 0.5, 0.5] }}
          transition={reduce ? { duration: 0.2 } : { ...loop, times }}
        />
        <motion.div
          className="absolute"
          style={{ left: -TIP.x, top: -TIP.y, width: W, transformOrigin: `${TIP.x}px ${TIP.y}px` }}
          animate={reduce ? undefined : { scale: [1, 1, 0.9, 0.9, 0.9, 1, 1, 1] }}
          transition={reduce ? undefined : { ...loop, times }}
        >
          <HandShape />
        </motion.div>
      </motion.div>
    </div>
  );
}

// A pointing hand: index finger up, the others curled, thumb out to the left.
// A dark see-through fill and a light rim, both fading towards the wrist, so
// it reads on the light widget and on bright or dark video alike.
function HandShape() {
  return (
    <svg viewBox="0 0 100 140" width={W} height={W * 1.4} style={{ filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.45))", overflow: "visible" }}>
      <defs>
        <linearGradient id="ghost-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3A3A" stopOpacity="0.92" />
          <stop offset="0.55" stopColor="#262626" stopOpacity="0.7" />
          <stop offset="1" stopColor="#1A1A1A" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ghost-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M26 64 L26 12 C26 7.6 29.6 4 34 4 C38.4 4 42 7.6 42 12 L42 52
           C42 47.6 45.1 45 49 45 C52.9 45 56 47.6 56 52 L56 57
           C56 53.1 58.7 50.8 62 50.8 C65.3 50.8 68 53.1 68 57 L68 63
           C68 59.7 70.2 57.6 73 57.6 C75.8 57.6 78 59.7 78 63 L78 92
           C78 104 74.5 112 70 120 L68 140 L37 140 L35 123
           C29 116 19 104 11 91 C7.5 85.5 9.5 78.5 15.5 78.5
           C19.5 78.5 22.5 81.5 26 86 Z"
        fill="url(#ghost-fill)"
        stroke="url(#ghost-rim)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Knuckle creases of the curled fingers */}
      <path d="M42 66 C46 68 52 68 56 66 M56 70 C60 72 64 72 68 70 M68 75 C71 76.5 74.5 76.5 78 75" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
