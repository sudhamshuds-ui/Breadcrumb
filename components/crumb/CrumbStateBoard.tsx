"use client";

import { useState } from "react";
import type { CrumbStatus } from "@/lib/crumb-machine";
import { reels } from "@/lib/data/reels";
import { getThread } from "@/lib/data/threads";
import { CrumbWidget } from "./CrumbWidget";

// Review board: the live widget in each state, side by side (/states).
const flagged = reels.find((r) => r.id === "r1")!;
const facts = reels.find((r) => r.id === "r4")!;

const STATES: { title: string; note: string; status: CrumbStatus; reel: typeof flagged; found: number; announce?: boolean }[] = [
  { title: "Scanning", note: "Alive: light circles the rim, a pulse scales out and fades.", status: "scanning", reel: flagged, found: 0 },
  { title: "Dormant", note: "Listened, found nothing. No glow.", status: "dormant", reel: flagged, found: 0 },
  { title: "Flag announced", note: "Stretches into a chip for a few seconds.", status: "signals", reel: flagged, found: 1, announce: true },
  { title: "Flagged", note: "Folds back with a badge; red on hard flags.", status: "signals", reel: flagged, found: 3 },
  { title: "Facts stated", note: "Same behaviour in amber on grey-area reels.", status: "signals", reel: facts, found: 2 },
  { title: "Off", note: "Slid out left; the tab brings it back.", status: "off", reel: flagged, found: 0 },
];

export function CrumbStateBoard() {
  const [replay, setReplay] = useState(0);

  return (
    <div className="crumb-type min-h-dvh bg-[#2a2a2a] px-8 py-12 text-[#f7f7f4]">
      <h1 className="text-[26px] leading-tight font-normal tracking-[-0.0125em]">Crumb widget states</h1>
      <p className="mt-1 text-[14px] text-[#a09c92]">Live components on a dark reel-like background.</p>
      <button
        type="button"
        onClick={() => setReplay((r) => r + 1)}
        className="mt-4 h-10 rounded-full bg-[#f7f7f4] px-4 text-[14px] font-medium text-[#26251e]"
      >
        Replay animations
      </button>

      <div key={replay} className="mt-8 flex flex-wrap gap-6">
        {STATES.map((s) => {
          const found = s.reel.signals.slice(0, s.found);
          return (
            <div key={s.title} className="w-[260px]">
              <div className="relative h-[200px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#1b1f27] to-[#4a2c1c]">
                <CrumbWidget
                  morphId={s.title}
                  status={s.status}
                  open={false}
                  announcing={s.announce ? found[found.length - 1] : null}
                  found={found}
                  reel={s.reel}
                  thread={getThread(s.reel.threadId)}
                  bottom={73}
                  hidden={false}
                  dimmed={false}
                  onOpen={() => {}}
                  onClose={() => {}}
                  onTurnOff={() => {}}
                  onTurnOn={() => {}}
                  onSeeThread={() => {}}
                />
              </div>
              <div className="mt-3 text-[16px] font-medium">{s.title}</div>
              <div className="mt-0.5 text-[13px] text-[#a09c92]">{s.note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
