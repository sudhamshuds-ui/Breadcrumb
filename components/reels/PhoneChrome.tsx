"use client";

import { motion } from "motion/react";
import { Camera, ChevronDown, Clapperboard, House, Search, Send } from "lucide-react";
import type { CrumbStatus } from "@/lib/crumb-machine";
import { CrumbGlyph } from "@/components/crumb/CrumbGlyph";
import { MY_AVATAR } from "@/lib/avatars";

export function StatusBar({ crumbStatus, onIslandTap }: { crumbStatus: CrumbStatus; onIslandTap: () => void }) {
  const on = crumbStatus !== "off";
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[50px] items-center justify-between px-7 text-white max-[499px]:hidden">
      <span className="w-14 text-[16px] font-semibold tracking-tight">9:41</span>

      {/* Dynamic-island style pill (desktop frame only). Crumb's mark shows
          whether it's on; everything it finds stays in the widget. */}
      <button
        type="button"
        data-interactive
        onClick={onIslandTap}
        aria-label={on ? "Crumb is on" : "Turn Crumb on"}
        className="pointer-events-auto absolute left-1/2 top-[11px] flex h-[34px] w-[120px] -translate-x-1/2 items-center rounded-full bg-black pl-2"
      >
        <motion.span
          className="flex size-[22px] items-center justify-center rounded-full bg-[#EDEDED]"
          animate={{ opacity: on ? 1 : 0.3 }}
        >
          <CrumbGlyph size={14} body="#0A0A0A" face="#EDEDED" />
        </motion.span>
      </button>

      <span className="flex w-14 items-center justify-end gap-1.5">
        <Bars />
        <span className="text-[12px] font-semibold">5G</span>
        <span className="flex h-[13px] min-w-[25px] items-center justify-center rounded-[4px] bg-white px-1 text-[10px] font-bold text-black">
          49
        </span>
      </span>
    </div>
  );
}

function Bars() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="white" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="6" rx="1" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" opacity="0.4" />
    </svg>
  );
}

export function TopBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 z-20 flex h-11 items-center justify-between px-4 text-white" style={{ top: "var(--top-inset)" }}>
      <span className="flex items-center gap-1 text-[22px] font-bold tracking-tight drop-shadow">
        Reels <ChevronDown size={18} strokeWidth={2.6} />
      </span>
      <Camera size={25} strokeWidth={1.9} className="drop-shadow" />
    </div>
  );
}

export function BottomNav() {
  // Floating see-through pill over the video. No blur: redrawing a blur over
  // moving video every frame made swiping stutter on phones.
  return (
    <div className="pointer-events-none absolute inset-x-0 z-20 flex justify-center" style={{ bottom: "var(--bottom-inset)" }}>
      <nav
        data-interactive
        className="pointer-events-auto flex h-[52px] w-[300px] items-center justify-between rounded-full border border-white/15 bg-black/30 px-2 text-white"
      >
        <NavIcon><House size={23} strokeWidth={1.9} /></NavIcon>
        <NavIcon active><Clapperboard size={23} strokeWidth={1.9} /></NavIcon>
        <NavIcon><Send size={22} strokeWidth={1.9} /></NavIcon>
        <NavIcon><Search size={23} strokeWidth={1.9} /></NavIcon>
        <NavIcon>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MY_AVATAR} alt="Your profile" className="size-[25px] rounded-full object-cover ring-2 ring-white/90" />
        </NavIcon>
      </nav>
    </div>
  );
}

function NavIcon({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className={"flex h-[38px] w-[50px] items-center justify-center rounded-full " + (active ? "bg-white/15" : "")}>
      {children}
    </span>
  );
}

// Only in the desktop frame; a real phone draws its own.
export function HomeIndicator() {
  return (
    <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white max-[499px]:hidden" />
  );
}
