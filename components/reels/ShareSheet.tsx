"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, CirclePlus, Link2, Search, Share } from "lucide-react";
import type { Reel } from "@/lib/types";

// Fictional friends, the same people who appear in Breadcrumb threads.
const FRIENDS = [
  { name: "Jess", handle: "jess.parker", tint: "#C9B79C" },
  { name: "Tom", handle: "tommo_88", tint: "#9FBBE0" },
  { name: "Priya", handle: "priya.k", tint: "#DFA88F" },
  { name: "Sam", handle: "sam.on.site", tint: "#9FC9A2" },
  { name: "Ana", handle: "ana.lima", tint: "#C0A8DD" },
  { name: "Dave", handle: "dave_builds", tint: "#E0A64F" },
];

interface Props {
  open: boolean;
  reel: Reel;
  onClose: () => void;
  onNotice: (text: string) => void; // short confirmation after an action
}

export function ShareSheet({ open, reel, onClose, onNotice }: Props) {
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (name: string) =>
    setPicked((p) => (p.includes(name) ? p.filter((n) => n !== name) : [...p, name]));

  const link = () =>
    typeof window === "undefined" ? "" : `${window.location.origin}/reels?reel=${reel.id}`;

  const done = (text: string) => {
    onClose();
    onNotice(text);
  };

  const send = () => {
    const names = picked.length === 1 ? picked[0] : `${picked.length} people`;
    done(`Sent to ${names}`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      done("Link copied");
    } catch {
      done("Couldn't copy the link");
    }
  };

  const shareTo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: link(), title: `Reel by ${reel.creator.handle}` });
        onClose();
      } catch {
        // The tester closed the phone's share menu; leave the sheet open.
      }
    } else {
      copy();
    }
  };

  return (
    <AnimatePresence onExitComplete={() => setPicked([])}>
      {open && (
        <motion.div
          key="share-scrim"
          data-interactive
          className="absolute inset-0 z-40 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          key="share-sheet"
          data-interactive
          role="dialog"
          aria-label="Share"
          className="absolute inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-sheet pb-[max(16px,env(safe-area-inset-bottom))] text-white"
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

          <div className="px-4 pt-2" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-[15px] text-white/50">
              <Search size={17} strokeWidth={2} />
              Search
            </div>

            {/* Friends: tap to pick, like the real app */}
            <div className="mt-4 grid grid-cols-3 gap-y-4">
              {FRIENDS.map((f) => {
                const on = picked.includes(f.name);
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => toggle(f.name)}
                    aria-pressed={on}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className="relative">
                      <span
                        className="flex size-[62px] items-center justify-center rounded-full text-[20px] font-semibold text-black/70"
                        style={{ background: f.tint }}
                      >
                        {f.name[0]}
                      </span>
                      <AnimatePresence>
                        {on && (
                          <motion.span
                            className="absolute -right-0.5 -bottom-0.5 flex size-[22px] items-center justify-center rounded-full bg-[#0095F6] ring-2 ring-sheet"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 600, damping: 28 }}
                          >
                            <Check size={13} strokeWidth={3} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="text-[12.5px] leading-tight">{f.name}</span>
                    <span className="-mt-1 text-[11px] text-white/50">{f.handle}</span>
                  </button>
                );
              })}
            </div>

            {/* Send replaces the quick actions once someone is picked */}
            <div className="relative mt-5 h-[76px]">
              <AnimatePresence initial={false}>
                {picked.length > 0 ? (
                  <motion.button
                    key="send"
                    type="button"
                    onClick={send}
                    className="absolute inset-x-0 top-0 h-12 rounded-xl bg-[#0095F6] text-[15px] font-semibold active:opacity-80"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {picked.length === 1 ? "Send" : "Send separately"}
                  </motion.button>
                ) : (
                  <motion.div
                    key="actions"
                    className="absolute inset-x-0 top-0 flex justify-around"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Action label="Add to story" onClick={() => done("Added to your story")}>
                      <CirclePlus size={22} strokeWidth={1.9} />
                    </Action>
                    <Action label="Copy link" onClick={copy}>
                      <Link2 size={22} strokeWidth={1.9} />
                    </Action>
                    <Action label="Share to…" onClick={shareTo}>
                      <Share size={21} strokeWidth={1.9} />
                    </Action>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Action({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-20 flex-col items-center gap-1.5 active:opacity-70">
      <span className="flex size-12 items-center justify-center rounded-full bg-white/12">{children}</span>
      <span className="text-[12px] text-white/85">{label}</span>
    </button>
  );
}
