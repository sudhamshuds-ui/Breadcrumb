"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

// A playback clock for scripted reels. `t` updates ~20 times a second for
// captions and signals; `time` is a motion value for smooth visuals.
export function useReelClock(duration: number, playing: boolean, initialTime = 0) {
  const [t, setT] = useState(initialTime);
  const tRef = useRef(initialTime);
  const time: MotionValue<number> = useMotionValue(initialTime);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let lastPublished = -1;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      tRef.current = (tRef.current + dt) % duration;
      time.set(tRef.current);
      const bucket = Math.floor(tRef.current * 20);
      if (bucket !== lastPublished) {
        lastPublished = bucket;
        setT(tRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, time]);

  const seek = useCallback(
    (s: number) => {
      tRef.current = Math.max(0, Math.min(duration - 0.01, s));
      time.set(tRef.current);
      setT(tRef.current);
    },
    [duration, time],
  );

  return { t, time, seek };
}
