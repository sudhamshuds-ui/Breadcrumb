"use client";

import { useRef, useState } from "react";
import { animate, useMotionValue, type MotionValue } from "motion/react";

// Pull down on the first reel to refresh, like the real app. `pull` is how
// far the indicator has come down (with resistance, so it feels elastic);
// past `threshold` on release it spins and `onRefresh` runs.
export const PULL_THRESHOLD = 72;

export function usePullToRefresh({
  enabled,
  getScroller,
  onRefresh,
}: {
  enabled: boolean; // only on the first reel, with nothing open on top
  getScroller: () => HTMLElement | null;
  onRefresh: () => void;
}) {
  const pull: MotionValue<number> = useMotionValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const el = getScroller();
    // Only a pull that starts with the feed at the very top counts.
    startY.current = enabled && !refreshing && el && el.scrollTop <= 0 ? e.touches[0].clientY : null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    pull.set(dy > 0 ? Math.min(PULL_THRESHOLD * 1.6, dy * 0.5) : 0);
  };

  const onTouchEnd = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull.get() >= PULL_THRESHOLD) {
      setRefreshing(true);
      animate(pull, PULL_THRESHOLD, { type: "spring", stiffness: 400, damping: 30 });
      // A beat of spinning, so the refresh reads as one.
      setTimeout(onRefresh, 550);
    } else {
      animate(pull, 0, { type: "spring", stiffness: 400, damping: 34 });
    }
  };

  return { pull, refreshing, handlers: { onTouchStart, onTouchMove, onTouchEnd } };
}
