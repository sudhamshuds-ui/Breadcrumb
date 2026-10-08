"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// TEST: a Siri / Apple Intelligence style glow around the screen edges when
// Crumb finds a signal on a flagged reel. Each new `pulse` blooms the glow,
// lets it flow around the border for a few seconds, then fades it out.
//
// Cheap on phones: no blur filter. Softness comes from a mask that fades the
// colour in from the edges; the flow is a rotating conic gradient underneath
// (a transform, which the GPU handles without repainting).

const COLORS =
  "conic-gradient(from 0deg, #FF6A5C, #FFA07A, #C79BFF, #7FA8FF, #FF8FB1, #FF6A5C)";

// Two soft strips (left/right and top/bottom) added together form the ring.
const EDGE = 30; // px the glow reaches into the screen
const RING_MASK = [
  `linear-gradient(to right, #000 0px, rgba(0,0,0,0.45) ${EDGE * 0.35}px, transparent ${EDGE}px, transparent calc(100% - ${EDGE}px), rgba(0,0,0,0.45) calc(100% - ${EDGE * 0.35}px), #000 100%)`,
  `linear-gradient(to bottom, #000 0px, rgba(0,0,0,0.45) ${EDGE * 0.35}px, transparent ${EDGE}px, transparent calc(100% - ${EDGE}px), rgba(0,0,0,0.45) calc(100% - ${EDGE * 0.35}px), #000 100%)`,
].join(", ");

export function EdgeGlow({ pulse }: { pulse: number | null }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {pulse !== null && (
        <motion.div
          key={pulse}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[25] overflow-hidden"
          // "screen" blends it as light: it brightens the video under it
          // instead of painting over it.
          style={{ maskImage: RING_MASK, WebkitMaskImage: RING_MASK, mixBlendMode: "screen" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 6.2, times: [0, 0.095, 0.8, 1], ease: "easeInOut" }}
        >
          <motion.div
            className="absolute top-1/2 left-1/2 aspect-square w-[250%]"
            style={{ background: COLORS, x: "-50%", y: "-50%" }}
            initial={{ rotate: 0 }}
            animate={{ rotate: reduce ? 0 : 440 }}
            transition={{ duration: 6.2, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
