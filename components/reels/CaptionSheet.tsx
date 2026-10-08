"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart, ImageIcon, Smile, X } from "lucide-react";
import type { Reel, Signal } from "@/lib/types";
import { captionParts } from "@/lib/playback";
import { CrumbMini } from "@/components/crumb/CrumbWidget";
import { inkStyle, KindMark, useIconStyle } from "@/components/crumb/SignalIcon";
import { Avatar } from "./ReelChrome";
import { MY_AVATAR, avatarFor } from "@/lib/avatars";

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
  const iconStyle = useIconStyle();
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

            {/* Crumb itself, in miniature: the widget is hidden while the sheet is up */}
            {signals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                className="crumb-type mt-3 flex items-center gap-3"
              >
                <CrumbMini tier={reel.tier} count={signals.length} onTap={onOpenPeek} />
                <button type="button" onClick={onOpenPeek} className="text-left text-[13.5px] leading-snug text-white/75 active:text-white">
                  {reel.tier === "flag" ? "Crumb found" : "Crumb noticed"} {signals.length}{" "}
                  {signals.length === 1 ? "thing" : "things"} in this reel.{" "}
                  <span className="font-medium text-white">See what</span>
                </button>
              </motion.div>
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
                    style={inkStyle(p.signal.kind, "dark")}
                  >
                    {p.text}
                  </span>
                ) : (
                  <span key={i}>{p.text}</span>
                ),
              )}
            </p>

            {signals.length > 0 && !selected && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-white/55">
                Tap a highlight to see what Crumb found
              </p>
            )}

            <div className="mt-3 text-[13px] text-white/55">{reel.postedOn}</div>

            <div className="mt-4 border-t border-white/10 pt-4">
              {reel.comments.map((c) => (
                <div key={c.author + c.text} className="mb-4 flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarFor(c.author)} alt="" className="size-8 shrink-0 rounded-full bg-white/10 object-cover" />
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

          {/* What Crumb noticed about the tapped phrase: pinned above the comment
              box so it's always in view, however long the caption is. */}
          <AnimatePresence initial={false}>
            {selected && (
              <motion.div
                key="selected-signal"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-2"
              >
                <div className="crumb-type flex items-start gap-2.5 rounded-[20px] bg-white p-3 text-crumb-ink" role="status">
                  <KindMark kind={selected.kind} style={iconStyle} size={30} />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-[14px] font-medium">{selected.label}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-crumb-body">{selected.detail}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Close"
                    className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full text-crumb-muted active:bg-crumb-hairline"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 border-t border-white/10 px-4 pt-3 pb-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MY_AVATAR} alt="You" className="size-10 shrink-0 rounded-full object-cover" />
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
