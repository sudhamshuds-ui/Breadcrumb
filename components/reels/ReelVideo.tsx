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
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    register(reel.id, ref.current);
    return () => register(reel.id, null);
  }, [reel.id, register]);

  // iPhones ignore "preload" and leave paused videos unloaded, which shows as
  // black when you swipe to them. Playing a neighbour for a moment (muted)
  // makes the phone actually load it, so it's ready the instant it's reached.
  const warmed = useRef(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || active || !preload || warmed.current) return;
    warmed.current = true;
    v.muted = true; // never a blip of sound from a reel you can't see
    v.play()
      .then(() => {
        if (!activeRef.current) v.pause();
      })
      .catch(() => {});
  }, [active, preload]);

  // React's `muted` attribute is unreliable, so set the property directly.
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  // Warm-up left a neighbour muted; give it the current sound setting on arrival.
  useEffect(() => {
    if (active && ref.current) ref.current.muted = muted;
  }, [active, muted]);

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
      // The first-frame still sits behind the video, so a reel that hasn't
      // started yet shows its picture instead of black.
      style={{
        backgroundColor: reel.theme.from,
        backgroundImage: `url(${reel.poster})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <video
        ref={ref}
        src={reel.src}
        poster={reel.poster}
        className="absolute inset-0 h-full w-full bg-transparent object-cover"
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
