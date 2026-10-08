"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// TEST: a Siri / Apple Intelligence style glow around the screen edges when
// Crumb finds a signal on a flagged reel. Each new `pulse` blooms the glow,
// lets it flow around the border for a few seconds, then fades it out.
//
// Cheap on phones: the soft rounded ring is drawn once into an image (sized
// to the screen) and used as a mask; the flow is a rotating conic gradient
// underneath (a transform, which the GPU handles without repainting).

const COLORS =
  "conic-gradient(from 0deg, #FF6A5C, #FFA07A, #C79BFF, #7FA8FF, #FF8FB1, #FF6A5C)";

const RADIUS = 64; // how round the glow's inner edge is at the corners
const REACH = 34; // how far the glow fades in from the edge (px)

// Draws the ring: solid at the screen edge, fading smoothly inward, with
// rounded inner corners. A blurred rounded rectangle is "cut out" of a solid
// fill, which gives one seamless falloff (no gradient pieces meeting).
function drawRingMask(w: number, h: number): string {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const c = document.createElement("canvas");
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  // Cut out the middle with a soft edge. The shape is drawn far off-canvas and
  // only its blurred shadow lands on the canvas (works in every browser).
  const inset = REACH * 0.6;
  const off = w + h + 1000;
  ctx.globalCompositeOperation = "destination-out";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = REACH * 0.9 * dpr;
  ctx.shadowOffsetX = off * dpr;
  ctx.beginPath();
  ctx.roundRect(inset - off, inset, w - inset * 2, h - inset * 2, Math.max(8, RADIUS - inset));
  ctx.fill();

  return c.toDataURL("image/png");
}

export function EdgeGlow({ pulse }: { pulse: number | null }) {
  const reduce = useReducedMotion();
  const sizer = useRef<HTMLDivElement>(null);
  const [mask, setMask] = useState("");

  // Redraw the ring only when the screen size changes.
  useEffect(() => {
    const el = sizer.current;
    if (!el) return;
    let last = "";
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const key = `${w}x${h}`;
      if (!w || !h || key === last) return;
      last = key;
      setMask(`url(${drawRingMask(w, h)})`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <div ref={sizer} aria-hidden className="pointer-events-none absolute inset-0" />
      <AnimatePresence>
        {pulse !== null && mask && (
          <motion.div
            key={pulse}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[25] overflow-hidden"
            // "screen" blends it as light: it brightens the video under it
            // instead of painting over it.
            style={{
              maskImage: mask,
              WebkitMaskImage: mask,
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
              // No clip of our own: the phone's screen (or the desktop frame)
              // rounds the outer corners; a second curve left a hard sliver.
              mixBlendMode: "screen",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 5.2, times: [0, 0.113, 0.762, 1], ease: "easeInOut" }}
          >
            <motion.div
              className="absolute top-1/2 left-1/2 aspect-square w-[250%]"
              style={{ background: COLORS, x: "-50%", y: "-50%" }}
              initial={{ rotate: 0 }}
              animate={{ rotate: reduce ? 0 : 370 }}
              transition={{ duration: 5.2, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
