"use client";

import { memo, useEffect, useRef } from "react";
import type { Reel } from "@/lib/types";

interface Props {
  reel: Reel;
  active: boolean; // the reel on screen
  playing: boolean; // false while paused or held
  muted: boolean;
  preload: boolean; // the reel on screen and its neighbours load ahead
  startAt: number; // where the first reel starts (coming back from a thread)
  register: (id: string, el: HTMLVideoElement | null) => void;
  onAutoMuted: () => void; // the phone refused to play with sound
}

// One reel's video. Only the reel on screen plays; the others sit paused on
// their first frame so a swipe never waits for anything to be built.
export const ReelVideo = memo(function ReelVideo({
  reel,
  active,
  playing,
  muted,
  preload,
  startAt,
  register,
  onAutoMuted,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const started = useRef(false);

  useEffect(() => {
    register(reel.id, ref.current);
    return () => register(reel.id, null);
  }, [reel.id, register]);

  // React's `muted` attribute is unreliable, so set the property directly.
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!active || !playing) {
      v.pause();
      return;
    }
    if (!started.current) {
      started.current = true;
      if (startAt > 0) v.currentTime = startAt;
    }
    v.play().catch(() => {
      // iPhones only allow sound after a tap on this video; fall back to muted.
      if (!v.muted) {
        v.muted = true;
        onAutoMuted();
        v.play().catch(() => {});
      }
    });
  }, [active, playing, startAt, onAutoMuted]);

  return (
    <div
      className="absolute inset-0 overflow-clip"
      style={{ background: `linear-gradient(170deg, ${reel.theme.from} 0%, ${reel.theme.to} 100%)` }}
    >
      <video
        ref={ref}
        // "#t=0.001" makes iPhones draw the first frame before playing.
        src={`${reel.src}#t=0.001`}
        poster={reel.poster ?? undefined}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        loop
        preload={preload ? "auto" : "metadata"}
        disablePictureInPicture
        aria-label={`Reel by ${reel.creator.handle}`}
      />
      {/* Darkens top and bottom so the overlay text stays readable */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 16%, transparent 60%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
});
