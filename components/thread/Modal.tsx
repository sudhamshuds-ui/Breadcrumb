"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

// A card that opens in the middle of the page, over a dimmed thread. Tap
// outside, tap × or press Escape to close. Long content scrolls inside it.
export function Modal({ open, title, onClose, children }: Props) {
  const reduce = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);

  // Keyboard focus moves into the card once, when it opens
  useEffect(() => {
    if (open) panel.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Rendered into the page's overlay layer, so a modal opened from inside the
  // scrolling thread still covers the whole screen.
  const layer = typeof document === "undefined" ? null : document.getElementById(MODAL_LAYER_ID);

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="absolute inset-0 z-50 flex items-center justify-center px-3 pt-[calc(var(--top-inset)+12px)] pb-[max(16px,env(safe-area-inset-bottom))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-crumb-ink/35" onClick={onClose} aria-hidden />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative flex max-h-full w-full flex-col overflow-hidden rounded-[28px] bg-crumb-surface text-crumb-ink outline-none"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: "spring", stiffness: 460, damping: 36 }}
          >
            <div className="flex items-center justify-between py-3 pr-3 pl-5">
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  return layer ? createPortal(modal, layer) : modal;
}

export const MODAL_LAYER_ID = "thread-modal-layer";
