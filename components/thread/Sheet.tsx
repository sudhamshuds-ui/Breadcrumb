"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

// Light bottom sheet for the thread page. Swipe down, tap outside or tap the
// close button to dismiss.
export function Sheet({ open, title, onClose, children }: Props) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="scrim"
          className="absolute inset-0 z-40 bg-crumb-ink/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        />
      )}
      {open && (
        <motion.div
          key="sheet"
          role="dialog"
          aria-label={title}
          className="absolute inset-x-0 bottom-0 z-50 flex max-h-[88%] flex-col rounded-t-[28px] border-t border-crumb-hairline bg-crumb-surface pb-[max(16px,env(safe-area-inset-bottom))] text-crumb-ink"
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
          <div className="flex justify-center pt-2.5" aria-hidden>
            <div className="h-1 w-10 rounded-full bg-crumb-hairline-strong" />
          </div>
          <div className="flex items-center justify-between px-5 pt-2 pb-3">
            <h2 className="text-[20px] leading-tight tracking-[-0.01em]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-9 items-center justify-center rounded-full text-crumb-body active:bg-crumb-hairline"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5" onPointerDown={(e) => e.stopPropagation()}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
