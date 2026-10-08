"use client";

import { useCallback, useEffect, useState } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

// Reads the playing video's own clock, so Crumb stays in step even when the
// video buffers, loops or is paused. `t` updates ~20 times a second for
// signals; `time` is a motion value for smooth visuals like the progress bar.
export function useReelClock(getVideo: () => HTMLVideoElement | null) {
  const [t, setT] = useState(0);
  const time: MotionValue<number> = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    let lastPublished = -1;
    const tick = () => {
      const v = getVideo();
      if (v) {
        const now = v.currentTime;
        time.set(now);
        const bucket = Math.floor(now * 20);
        if (bucket !== lastPublished) {
          lastPublished = bucket;
          setT(now);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getVideo, time]);

  const seek = useCallback(
    (s: number) => {
      const v = getVideo();
      if (v) v.currentTime = s;
      time.set(s);
      setT(s);
    },
    [getVideo, time],
  );

  return { t, time, seek };
}
