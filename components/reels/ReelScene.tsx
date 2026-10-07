"use client";

import { memo } from "react";
import { AnimatePresence, motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import type { Reel, SceneBeat } from "@/lib/types";
import { activeBeat, activeLine, wordsShown } from "@/lib/playback";
import { Stethoscope } from "lucide-react";

// A scripted stand-in for real footage: a "faceless" health reel with
// product shots, kinetic text and auto-captions, all driven by time.

interface Props {
  reel: Reel;
  t: number;
  time: MotionValue<number> | null; // null when this reel isn't playing
  active: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// Memoised: reels that are not playing get fixed props, so they skip the
// 20-times-a-second re-render the playing reel needs.
export const ReelScene = memo(function ReelScene({ reel, t, time, active }: Props) {
  const reduce = useReducedMotion();
  const beat = activeBeat(reel.beats, t);
  const line = activeLine(reel.transcript, t);
  const beatIndex = beat ? reel.beats.indexOf(beat) : 0;

  return (
    <div
      className="absolute inset-0 overflow-clip"
      style={{
        background: `radial-gradient(120% 70% at 50% 30%, ${reel.theme.to}55 0%, transparent 60%), linear-gradient(170deg, ${reel.theme.from} 0%, ${reel.theme.to} 100%)`,
      }}
    >
      <Bokeh accent={reel.theme.accent} animated={active && !reduce} seed={reel.id.charCodeAt(1)} />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={`${reel.id}-${beatIndex}`}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {beat && <Beat beat={beat} reel={reel} time={time} />}
        </motion.div>
      </AnimatePresence>

      {/* Auto-captions */}
      {line && (
        <div className="absolute inset-x-6 top-[60%] flex justify-center">
          <p
            className="max-w-[300px] text-center text-[21px] leading-[1.2] font-extrabold tracking-tight text-white"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}
          >
            {line.text
              .split(" ")
              .slice(0, wordsShown(line, t))
              .map((w, i, arr) => (
                <span key={i} style={{ color: i === arr.length - 1 ? "#FFE36E" : undefined }}>
                  {w}{" "}
                </span>
              ))}
          </p>
        </div>
      )}

      {/* Pre-made noise tile: a live SVG noise filter is far too slow on phones */}
      <div
        className="reel-grain pointer-events-none absolute inset-0"
        style={{ backgroundImage: "url(/grain.png)", backgroundSize: "128px 128px" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 18%, transparent 62%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </div>
  );
});

function Beat({ beat, reel, time }: { beat: SceneBeat; reel: Reel; time: MotionValue<number> | null }) {
  switch (beat.kind) {
    case "hook":
    case "talk":
      return (
        <div className="absolute inset-x-8 top-[22%] flex flex-col items-center text-center text-white">
          {beat.kind === "talk" && reel.product.shape === "none" && (
            <Stethoscope size={44} strokeWidth={1.4} className="mb-4 opacity-70" />
          )}
          <motion.h2
            className="text-[46px] leading-[0.95] font-black tracking-[-0.03em]"
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
          >
            {beat.title}
          </motion.h2>
          {beat.subtitle && (
            <motion.p
              className="mt-3 text-[17px] font-medium opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              {beat.subtitle}
            </motion.p>
          )}
        </div>
      );
    case "product":
      return (
        <div className="absolute inset-x-0 top-[17%] flex justify-center">
          <Product reel={reel} time={time} size={1} />
        </div>
      );
    case "detail":
      return (
        <>
          <div className="absolute left-1/2 top-[13%] -translate-x-1/2 opacity-90">
            <Product reel={reel} time={time} size={0.72} />
          </div>
          <div className="absolute inset-x-8 top-[46%] text-center text-white">
            <h2 className="text-[40px] leading-none font-black tracking-[-0.03em]">{beat.title}</h2>
            {beat.subtitle && <p className="mt-2 text-[15px] font-medium opacity-80">{beat.subtitle}</p>}
          </div>
        </>
      );
    case "code":
      return (
        <div className="absolute inset-x-0 top-[22%] flex flex-col items-center">
          <motion.div
            initial={{ rotate: -8, y: 30, opacity: 0 }}
            animate={{ rotate: -3, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative flex h-[128px] w-[256px] overflow-hidden rounded-[18px] bg-[#FFF6EC] text-[#1A120C] shadow-2xl"
          >
            <div className="flex w-[70px] flex-col items-center justify-center bg-[#E2653A] text-white">
              <span className="text-[30px] leading-none font-black">15%</span>
              <span className="mt-1 text-[11px] font-semibold">off</span>
            </div>
            <div className="flex flex-1 flex-col justify-center border-l-2 border-dashed border-[#1A120C]/20 px-4">
              <span className="text-[11px] font-semibold opacity-60">use code</span>
              <span className="font-mono text-[36px] leading-none font-black tracking-tight">{beat.title}</span>
              <span className="mt-2 text-[11px] font-medium opacity-60">{reel.product.brand} · link in bio</span>
            </div>
          </motion.div>
        </div>
      );
  }
}

function Product({ reel, time, size }: { reel: Reel; time: MotionValue<number> | null; size: number }) {
  const fallback = useTransform(() => 0);
  const swing = useTransform(time ?? fallback, (v) => -24 + Math.sin(v * 0.7) * 9);
  const sway = useTransform(time ?? fallback, (v) => Math.sin(v * 0.9) * 3);

  if (reel.product.shape === "box") {
    const W = 142, H = 204, D = 46;
    return (
      <div style={{ perspective: 900, transform: `scale(${size})` }}>
        <motion.div className="relative" style={{ width: W, height: H, rotateY: swing, rotateX: 6, transformStyle: "preserve-3d" }}>
          {/* front */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-[6px] bg-[#F3EEE6] text-[#18120E]"
            style={{ transform: `translateZ(${D / 2}px)`, boxShadow: "inset 0 0 30px rgba(0,0,0,0.08)" }}
          >
            <div className="flex h-9 items-center justify-center bg-[#E2653A] text-[11px] font-black tracking-[0.35em] text-white">
              {reel.product.brand}
            </div>
            <div className="flex flex-1 flex-col px-3 pt-3">
              <span className="text-[30px] leading-none font-black tracking-tight">{reel.product.name}</span>
              <span className="mt-1.5 text-[10px] leading-tight font-semibold opacity-70">{reel.product.line}</span>
              <div className="mt-auto mb-3 flex items-end gap-2">
                <span className="h-12 w-4 rounded-b-full rounded-t-sm border-2 border-[#18120E]/70 bg-[#E2653A]/20" />
                <span className="text-[9px] leading-tight font-semibold opacity-60">1 kit<br />results in 7 days</span>
              </div>
            </div>
            <div className="h-2 bg-[#18120E]" />
          </div>
          {/* side */}
          <div
            className="absolute top-0 bg-[#D9D1C4]"
            style={{ width: D, height: H, left: W / 2 - D / 2, transform: `rotateY(90deg) translateZ(${W / 2}px)` }}
          >
            <div className="h-9 bg-[#B94F2B]" />
          </div>
          {/* top */}
          <div
            className="absolute left-0 bg-[#C9573A]"
            style={{ width: W, height: D, top: H / 2 - D / 2, transform: `rotateX(90deg) translateZ(${H / 2}px)` }}
          />
        </motion.div>
        <div className="mx-auto mt-5 h-4 w-32 rounded-[50%] bg-black/45 blur-md" />
      </div>
    );
  }

  if (reel.product.shape === "jar") {
    return (
      <motion.div style={{ rotate: sway, scale: size }} className="flex flex-col items-center">
        <div className="h-9 w-[132px] rounded-t-[10px] rounded-b-[4px] bg-gradient-to-r from-[#2E3A27] via-[#56664A] to-[#232C1E]" />
        <div className="relative -mt-1 h-[170px] w-[150px] overflow-hidden rounded-[22px] bg-gradient-to-r from-[#D8D2BF] via-[#F5F1E6] to-[#BDB6A0]">
          <div className="absolute inset-x-0 top-9 flex h-[96px] flex-col items-center justify-center bg-[#3E5A34] text-[#F2EEDF]">
            <span className="text-[10px] font-black tracking-[0.32em]">{reel.product.brand}</span>
            <span className="mt-1 text-[24px] leading-none font-black">{reel.product.name}</span>
            <span className="mt-1.5 text-[9px] font-semibold opacity-75">{reel.product.line}</span>
          </div>
          <div className="absolute inset-y-0 left-5 w-3 bg-white/40 blur-[3px]" />
        </div>
        <div className="mt-4 h-4 w-32 rounded-[50%] bg-black/40 blur-md" />
      </motion.div>
    );
  }

  return null;
}

function Bokeh({ accent, animated, seed }: { accent: string; animated: boolean; seed: number }) {
  const dots = Array.from({ length: 5 }, (_, i) => {
    const r = ((seed * (i + 3) * 37) % 100) / 100;
    return {
      left: `${(i * 17 + seed * 7) % 100}%`,
      top: `${(i * 29 + seed * 3) % 90}%`,
      size: 50 + r * 90,
      opacity: 0.08 + r * 0.18,
      delay: i * 0.7,
    };
  });
  return (
    <div className="absolute inset-0">
      {dots.map((d, i) => (
        <span
          key={i}
          className="motion-safe-anim absolute rounded-full"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            // Soft edge from a radial gradient, not filter: blur (much cheaper to draw)
            background: `radial-gradient(circle, ${i % 2 ? accent : "#FFFFFF"} 0%, transparent 70%)`,
            opacity: d.opacity * 1.6,
            animation: animated ? `bokeh-drift ${7 + i}s ease-in-out ${d.delay}s infinite` : undefined,
          }}
        />
      ))}
    </div>
  );
}
