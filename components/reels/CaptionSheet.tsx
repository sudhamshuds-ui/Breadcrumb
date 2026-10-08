"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleDollarSign, Heart, ImageIcon, Smile } from "lucide-react";
import type { Reel, Signal } from "@/lib/types";
import { captionParts, moneyTag } from "@/lib/playback";
import { CrumbGlyph } from "@/components/crumb/CrumbGlyph";
import { KindBadge } from "@/components/crumb/SignalIcon";
import { Avatar } from "./ReelChrome";

// Two neighbouring hues per signal kind, so the gradient moves between them
// (like Gemini's wordmark) while staying in that kind's pastel family.
const INK: Record<Signal["kind"], [string, string]> = {
  health_claim: ["var(--sig-lavender)", "var(--sig-blue)"],
  affiliate_link: ["var(--sig-blue)", "var(--sig-lavender)"],
  discount_code: ["var(--sig-peach)", "#f2c6b4"],
  paid_partnership: ["#e0a64f", "var(--sig-peach)"],
  product_mention: ["var(--sig-mint)", "var(--sig-blue)"],
};

interface Props {
  open: boolean;
  reel: Reel;
  top: number;
  // Signals Crumb can mark in the caption. Empty when Crumb is off or paused.
  signals: Signal[];
  onClose: () => void;
  onOpenPeek: () => void;
}

export function CaptionSheet({ open, reel, top, signals, onClose, onOpenPeek }: Props) {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<Signal | null>(null);
  const tag = moneyTag(signals);
  const parts = captionParts(reel.caption, signals);

  return (
    <AnimatePresence onExitComplete={() => setSelected(null)}>
      {open && (
        <motion.div
          key="caption-sheet"
          data-interactive
          className="absolute inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[28px] bg-sheet text-white"
          style={{ top }}
          initial={reduce ? { opacity: 0 } : { y: "100%" }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 40 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.7 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 90 || info.velocity.y > 500) onClose();
          }}
        >
          <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
            <div className="h-1 w-10 rounded-full bg-white/30" />
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <Avatar reel={reel} size={44} />
              <div className="min-w-0 leading-tight">
                <div className="text-[15px] font-semibold">{reel.creator.handle}</div>
                <div className="truncate text-[12.5px] text-white/60">
                  {reel.paidPartner ? `Paid partnership with ${reel.paidPartner}` : reel.creator.name}
                </div>
              </div>
              <span className="ml-auto shrink-0 rounded-lg border border-white/40 px-3 py-1 text-[13px] font-semibold">
                Follow
              </span>
            </div>

            {tag && (
              <motion.button
                type="button"
                onClick={onOpenPeek}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                // 44px tap area around a 28px pill
                className="crumb-type group mt-1.5 -mb-1.5 flex h-11 items-center"
              >
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-sig-peach pl-1 pr-2.5 text-[12.5px] font-medium text-crumb-ink group-active:opacity-80">
                  <span className="flex size-5 items-center justify-center rounded-full bg-crumb-surface">
                    <CrumbGlyph size={10} />
                  </span>
                  <CircleDollarSign size={13} strokeWidth={2.2} />
                  {tag}
                </span>
              </motion.button>
            )}

            <p className="mt-3 text-[15px] leading-[1.4] whitespace-pre-line text-white/95">
              {parts.map((p, i) =>
                p.signal ? (
                  // An inline span, not a <button>, so long phrases wrap like text
                  <span
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(selected?.id === p.signal!.id ? null : p.signal!)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      setSelected(selected?.id === p.signal!.id ? null : p.signal!);
                    }}
                    className="signal-ink cursor-pointer font-semibold"
                    data-selected={selected?.id === p.signal.id || undefined}
                    style={{ "--ink": INK[p.signal.kind][0], "--ink2": INK[p.signal.kind][1] } as React.CSSProperties}
                  >
                    {p.text}
                  </span>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </p>

            {/* What Crumb noticed about a highlighted phrase */}
            <AnimatePresence initial={false}>
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="crumb-type mt-3 flex items-start gap-2.5 rounded-2xl border border-crumb-hairline-strong bg-crumb-surface p-3 text-crumb-ink">
                    <KindBadge kind={selected.kind} size={28} />
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[13px] font-medium">{selected.label}</span>
                      <span className="mt-0.5 block text-[13px] text-crumb-muted">{selected.detail}</span>
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {signals.length > 0 && !selected && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-white/55">
                <CrumbGlyph size={10} className="opacity-70 invert" /> Tap a highlight to see what Crumb found
              </p>
            )}

            <div className="mt-3 text-[13px] text-white/55">{reel.postedOn}</div>

            <div className="mt-4 border-t border-white/10 pt-4">
              {reel.comments.map((c) => (
                <div key={c.author + c.text} className="mb-4 flex gap-3">
                  <span className="size-8 shrink-0 rounded-full bg-gradient-to-br from-white/30 to-white/5" />
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="text-[12.5px] text-white/60">
                      <span className="font-semibold text-white">{c.author}</span> {c.ago}
                      {c.byCreator && " · Author"}
                    </div>
                    <div className="text-[14px]">{c.text}</div>
                    <div className="mt-1 text-[12px] font-medium text-white/50">Reply</div>
                  </div>
                  <span className="flex flex-col items-center gap-0.5 text-white/60">
                    <Heart size={15} />
                    <span className="text-[11px]">{c.likes.toLocaleString()}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-white/10 px-4 pt-3 pb-7">
            <span className="size-10 shrink-0 rounded-full bg-gradient-to-br from-[#C9B79C] to-[#6E5A44]" />
            <div className="flex h-11 flex-1 items-center rounded-full border border-white/20 px-4 text-[14px] text-white/45">
              What do you think of this?
              <span className="ml-auto flex gap-3 text-white/80">
                <ImageIcon size={20} />
                <Smile size={20} />
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
