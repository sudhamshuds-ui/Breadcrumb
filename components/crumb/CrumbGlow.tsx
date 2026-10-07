"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// Crumb's living glow, in three phases:
//  scanning   a cool pastel aura turns slowly while a bright arc sweeps the rim
//  thinking   on each new signal the aura pulls in and spins up for a beat
//  responding a warm ripple pushes outward, breathes a few times, then holds still
//             (endless decorative motion is noise; the research says noise gets Crumb switched off)
//
// Purely visual. It reads the Crumb status and how many signals are found.

// Glow uses deeper takes on the DESIGN.md pastels: soft pastels wash out
// to white once blurred over dark video.
const COOL =
  "conic-gradient(from 0deg, #6f9be8, #a07ee6, #5fc49a, #ec9a6c, #6f9be8)";
const WARM =
  "conic-gradient(from 0deg, var(--crumb-glow), #f54e00, #ec9a6c, #c06ad8, var(--crumb-glow))";

// Turns a filled circle into a thin ring.
const RING_MASK = "radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px))";

interface Props {
  phase: "idle" | "scanning" | "found";
  foundCount: number;
}

export function CrumbGlow({ phase, foundCount }: Props) {
  const reduce = useReducedMotion();
  const spin = (seconds: number) =>
    reduce ? undefined : `crumb-spin ${seconds}s linear infinite`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Cool aura: scanning */}
      <motion.div
        className="absolute"
        style={{ inset: -20 }}
        initial={false}
        animate={{
          opacity: phase === "scanning" ? 0.9 : 0,
          scale: phase === "scanning" ? 1 : 0.7,
        }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Spin lives on an inner layer so it doesn't fight the scale above */}
        <div
          className="size-full rounded-full"
          style={{ background: COOL, filter: "blur(18px)", animation: spin(3.2) }}
        />
      </motion.div>

      {/* Warm aura: signals found, breathing slowly */}
      <motion.div
        className="absolute"
        style={{ inset: -20 }}
        initial={false}
        animate={
          phase === "found"
            ? reduce
              ? { opacity: 0.9, scale: 1.05 }
              : { opacity: [0.75, 1, 0.75], scale: [1, 1.12, 1] }
            : { opacity: 0, scale: 0.7 }
        }
        transition={
          phase === "found" && !reduce
            ? { duration: 2.6, repeat: 3, ease: [0.37, 0, 0.63, 1] }
            : { duration: 0.5 }
        }
      >
        <div
          className="size-full rounded-full"
          style={{ background: WARM, filter: "blur(18px)", animation: reduce ? undefined : "crumb-spin 9s ease-out 1" }}
        />
      </motion.div>

      {/* Radar sweep: a bright arc travelling round the rim while scanning */}
      <motion.div
        className="absolute -inset-[3px] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 250deg, rgba(255,255,255,0.15) 290deg, #ffffff 350deg, transparent 360deg)",
          WebkitMask: RING_MASK,
          mask: RING_MASK,
          animation: spin(1.3),
        }}
        initial={false}
        animate={{ opacity: phase === "scanning" ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Thinking + responding: replayed every time a new signal lands */}
      <AnimatePresence>
        {phase === "found" && foundCount > 0 && !reduce && (
          <motion.div key={`beat-${foundCount}`} className="absolute inset-0" exit={{ opacity: 0 }}>
            {/* Thinking: the aura gathers inward and spins up */}
            <motion.div
              className="absolute -inset-4 rounded-full"
              style={{ background: WARM, filter: "blur(10px)" }}
              initial={{ opacity: 0, scale: 1.3, rotate: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [1.3, 0.85, 1], rotate: 300 }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            />
            {/* Responding: two ripples push outward */}
            {[0, 0.16].map((delay) => (
              <motion.div
                key={delay}
                className="absolute inset-0 rounded-full"
                style={{ border: "2px solid var(--crumb-glow)" }}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: [0, 0.9, 0], scale: [1, 1.15, 2.1] }}
                transition={{ duration: 1, delay: 0.5 + delay, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
