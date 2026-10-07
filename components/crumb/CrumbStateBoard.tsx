"use client";

import { useState } from "react";
import { CrumbGlow } from "./CrumbGlow";
import { CrumbGlyph } from "./CrumbGlyph";

const STATES = [
  { title: "Dormant", note: "Nothing found yet. No glow.", phase: "idle" as const },
  { title: "Scanning", note: "Cool aura turns, a bright arc sweeps the rim.", phase: "scanning" as const },
  { title: "Thinking → responding", note: "Tap replay: the aura gathers, then ripples out.", phase: "found" as const },
];

export function CrumbStateBoard() {
  const [beat, setBeat] = useState(1);

  return (
    <div className="crumb-type min-h-dvh bg-[#2a2a2a] px-8 py-12 text-[#f7f7f4]">
      <h1 className="text-[26px] leading-tight font-normal tracking-[-0.0125em]">Crumb glow states</h1>
      <p className="mt-1 text-[14px] text-[#a09c92]">Live components, shown on a dark reel-like background.</p>

      <div className="mt-10 flex flex-wrap gap-6">
        {STATES.map((s) => (
          <div key={s.title} className="w-[240px]">
            <div className="relative flex h-[240px] items-center justify-center overflow-clip rounded-2xl bg-gradient-to-b from-[#1b1f27] to-[#4a2c1c]">
              <div className="relative size-[60px]">
                <CrumbGlow phase={s.phase} foundCount={s.phase === "found" ? beat : 0} />
                <div className="absolute inset-0 flex items-center justify-center rounded-full border border-crumb-hairline bg-crumb-surface">
                  <CrumbGlyph size={28} />
                </div>
              </div>
            </div>
            <div className="mt-3 text-[16px] font-medium">{s.title}</div>
            <div className="mt-0.5 text-[13px] text-[#a09c92]">{s.note}</div>
            {s.phase === "found" && (
              <button
                type="button"
                onClick={() => setBeat((b) => b + 1)}
                className="mt-3 h-11 rounded-full bg-crumb-accent px-5 text-[14px] font-medium text-white active:bg-crumb-accent-active"
              >
                Replay new signal
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
