"use client";

import { useEffect } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { ArrowUpRight, Pause, Play, Power } from "lucide-react";
import type { CrumbStatus } from "@/lib/crumb-machine";
import { CrumbGlyph } from "./CrumbGlyph";

const SIZE = 60;
const MARGIN = 14;
const SLIVER = 12; // how much of the handle shows when tucked
const TUCK_X = SIZE + MARGIN - SLIVER;
const MENU_WIDTH = 236;
const SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

interface Props {
  status: CrumbStatus;
  revealed: boolean;
  menuOpen: boolean;
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
          className="absolute z-30"
          style={{ x, right: MARGIN, top, width: SIZE, height: SIZE }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          drag={menuOpen ? false : "x"}
          dragConstraints={{ left: 0, right: TUCK_X }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const pos = x.get();
            const open =
              info.velocity.x < -250 ? true : info.velocity.x > 250 ? false : pos < TUCK_X / 2;
            // Spring back or snap open even if the state doesn't change.
            animate(x, open ? 0 : TUCK_X, SPRING);
            if (open && !revealed) props.onReveal();
            if (!open && revealed) props.onTuck();
          }}
          onTap={() => (revealed ? props.onToggleMenu() : props.onReveal())}
          aria-label={revealed ? "Crumb options" : "Pull out Crumb"}
          role="button"
        >
          {/* Glow behind the widget: soft shimmer while scanning, steady when signals are found */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full bg-crumb-glow"
            style={{ filter: "blur(16px)" }}
            initial={false}
            animate={
              glowing
                ? { opacity: 0.85, scale: 1.18 }
                : scanning && !reduce
                  ? { opacity: [0.15, 0.55, 0.15], scale: [1, 1.12, 1] }
                  : { opacity: scanning ? 0.35 : 0, scale: 1 }
            }
            transition={
              scanning && !reduce
                ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
          />

          {/* Toggle pill: grows left out of the widget */}
          <motion.div
            className="absolute right-0 top-0 h-full overflow-hidden rounded-full bg-crumb-surface"
            initial={false}
            animate={{ width: menuOpen ? MENU_WIDTH : SIZE }}
            transition={reduce ? { duration: 0.15 } : SPRING}
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.28)" }}
          >
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute left-0 top-0 flex h-full items-center gap-1 pl-3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.08, duration: 0.18 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <MenuItem
                    label={paused ? "Resume" : "Pause"}
                    onSelect={props.onPauseToggle}
                    icon={paused ? <Play size={18} strokeWidth={2.2} /> : <Pause size={18} strokeWidth={2.2} />}
                  />
                  <MenuItem label="Turn off" onSelect={props.onTurnOff} icon={<Power size={18} strokeWidth={2.2} />} />
                  <MenuItem
                    label="Breadcrumb"
                    onSelect={props.onOpenBreadcrumb}
                    icon={<ArrowUpRight size={18} strokeWidth={2.2} />}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* The widget itself */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-crumb-surface"
            style={{
              boxShadow: glowing ? "0 0 0 1px rgba(255,84,84,0.35)" : "0 6px 18px rgba(0,0,0,0.25)",
              opacity: paused ? 0.7 : 1,
            }}
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
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="flex w-[52px] flex-col items-center gap-1 rounded-2xl py-1 text-crumb-ink active:bg-black/5"
    >
      {icon}
      <span className="text-[10px] font-medium leading-none tracking-tight">{label}</span>
    </button>
  );
}
