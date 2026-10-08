"use client";

import { useEffect, useRef } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { ArrowUpRight, ChevronsRight, Pause, Play, Power } from "lucide-react";
import type { CrumbStatus } from "@/lib/crumb-machine";
import { CrumbGlyph } from "./CrumbGlyph";
import { CrumbGlow } from "./CrumbGlow";

const SIZE = 60;
const MARGIN = 14;
const SLIVER = 12; // how much of the handle shows when tucked
const TUCK_X = SIZE + MARGIN - SLIVER;
const MENU_WIDTH = 288;
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

interface Props {
  status: CrumbStatus;
  revealed: boolean;
  menuOpen: boolean;
  foundCount: number;
  calm?: boolean; // "facts" reels: chip only, no warm glow
  top: number;
  onReveal: () => void;
  onTuck: () => void;
  onToggleMenu: () => void;
  onPauseToggle: () => void;
  onTurnOff: () => void;
  onOpenBreadcrumb: () => void;
}

export function CrumbHandle(props: Props) {
  const { status, revealed, menuOpen, top } = props;
  const reduce = useReducedMotion();
  const x = useMotionValue(revealed ? 0 : TUCK_X);
  // iOS often fires a "tap" at the end of a drag. Ignore taps right after one,
  // or pulling Crumb out would also open (and act on) the menu.
  const justDragged = useRef(false);

  useEffect(() => {
    animate(x, revealed ? 0 : TUCK_X, reduce ? { duration: 0.15 } : SPRING);
  }, [revealed, reduce, x]);

  const glowing = status === "signals" || status === "peek";
  const scanning = status === "scanning";
  const paused = status === "paused";

  return (
    <AnimatePresence>
      {status !== "off" && (
        <motion.div
          key="crumb-handle"
          data-interactive
          className="absolute z-30 rounded-full"
          style={{ x, right: MARGIN, top, width: SIZE, height: SIZE, outlineOffset: 4 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          drag={menuOpen ? false : "x"}
          dragConstraints={{ left: 0, right: TUCK_X }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragStart={() => (justDragged.current = true)}
          onDragEnd={(_, info) => {
            setTimeout(() => (justDragged.current = false), 350);
            const pos = x.get();
            const open =
              info.velocity.x < -250 ? true : info.velocity.x > 250 ? false : pos < TUCK_X / 2;
            // Spring back or snap open even if the state doesn't change.
            animate(x, open ? 0 : TUCK_X, SPRING);
            if (open && !revealed) props.onReveal();
            if (!open && revealed) props.onTuck();
          }}
          onTap={() => {
            if (justDragged.current) return;
            if (revealed) props.onToggleMenu();
            else props.onReveal();
          }}
          whileTap={menuOpen ? undefined : { scale: 0.94 }}
          // Keyboard and single-tap alternative to the drag gesture
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            if (revealed) props.onToggleMenu();
            else props.onReveal();
          }}
          aria-label={revealed ? "Crumb options" : "Pull out Crumb"}
          aria-expanded={revealed ? menuOpen : undefined}
          role="button"
        >
          <CrumbGlow phase={glowing && !props.calm ? "found" : scanning ? "scanning" : "idle"} foundCount={props.foundCount} />

          {/* Toggle pill: grows left out of the widget */}
          <motion.div
            className="absolute right-0 top-0 h-full overflow-hidden rounded-full bg-crumb-surface ring-1 ring-black/10"
            initial={false}
            animate={{ width: menuOpen ? MENU_WIDTH : SIZE }}
            transition={reduce ? { duration: 0.15 } : SPRING}
          >
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute left-0 top-0 flex h-full items-stretch pl-2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.08, duration: 0.3, ease: [0.32, 0.72, 0, 1] } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <MenuItem label="Hide" onSelect={props.onTuck} icon={<ChevronsRight size={18} strokeWidth={1.75} />} />
                  <MenuItem
                    label={paused ? "Resume" : "Pause"}
                    onSelect={props.onPauseToggle}
                    icon={paused ? <Play size={18} strokeWidth={1.75} /> : <Pause size={18} strokeWidth={1.75} />}
                  />
                  <MenuItem label="Turn off" onSelect={props.onTurnOff} icon={<Power size={18} strokeWidth={1.75} />} />
                  <MenuItem
                    label="Breadcrumb"
                    onSelect={props.onOpenBreadcrumb}
                    icon={<ArrowUpRight size={18} strokeWidth={1.75} />}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* The widget itself */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-crumb-surface ring-1 ring-black/10"
            style={{ opacity: paused ? 0.7 : 1 }}
          >
            <CrumbGlyph size={28} />
            {paused && (
              <span className="absolute -bottom-0.5 -left-0.5 flex size-5 items-center justify-center rounded-full bg-crumb-ink text-white">
                <Pause size={10} strokeWidth={3} />
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuItem({ label, icon, onSelect }: { label: string; icon: React.ReactNode; onSelect: () => void }) {
  // Only act on a press that started on this option. A finger that lands
  // elsewhere (e.g. mid-drag) and lifts over it must not trigger it.
  const pressed = useRef(false);
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation();
        pressed.current = true;
      }}
      onPointerCancel={() => (pressed.current = false)}
      onClick={(e) => {
        e.stopPropagation();
        const fromKeyboard = e.detail === 0;
        if (!pressed.current && !fromKeyboard) return;
        pressed.current = false;
        onSelect();
      }}
      className="crumb-type flex w-[54px] flex-col items-center justify-center gap-1 rounded-full text-crumb-ink active:bg-crumb-hairline"
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}
