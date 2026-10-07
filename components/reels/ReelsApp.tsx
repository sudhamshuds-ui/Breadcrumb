"use client";

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useTransform } from "motion/react";
import { Heart, Play, Volume2, VolumeX } from "lucide-react";
import { reels } from "@/lib/data/reels";
import { getThread } from "@/lib/data/threads";
import { crumbReducer, initialCrumbState, isListening } from "@/lib/crumb-machine";
import { dueSignals, foundSignals } from "@/lib/playback";
import { useReelClock } from "@/lib/use-reel-clock";
import { readStore, writeStore } from "@/lib/storage";
import { CrumbHandle } from "@/components/crumb/CrumbHandle";
import { CrumbCallout } from "@/components/crumb/CrumbCallout";
import { ReelScene } from "./ReelScene";
import { ReelChrome } from "./ReelChrome";
import { CaptionSheet } from "./CaptionSheet";
import { BottomNav, StatusBar, TopBar } from "./PhoneChrome";

const NAV_H = 84; // black band holding the bottom nav
const CHROME_BOTTOM = 0; // chrome sits just above the nav band, inside the video
const CHIP_BOTTOM = NAV_H + 104; // above the creator row and caption
const HANDLE_TOP = 268;
const SHEET_TOP_RATIO = 0.4;
const SETTLE_MS = 120; // scroll is "done" after this long without a scroll event
const ENABLED_KEY = "crumb.enabled";

interface Burst {
  id: number;
  x: number;
  y: number;
}

export function ReelsApp() {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();

  const startIndex = Math.max(0, reels.findIndex((r) => r.id === params.get("reel")));
  const startTime = Number(params.get("t")) || 0;

  const [index, setIndex] = useState(startIndex);
  const [crumb, dispatch] = useReducer(crumbReducer, undefined, () => initialCrumbState(true));
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [toast, setToast] = useState<null | "off" | "paused">(null);
  const [frameH, setFrameH] = useState(844);

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(startIndex);
  const pageH = frameH - NAV_H; // one reel = the video area above the nav
  const reel = reels[index];
  const thread = getThread(reel.threadId);
  const found = foundSignals(reel, crumb.found);

  const { t, time, seek } = useReelClock(reel.durationSec, !holding && !paused, startTime);

  // ---- frame size ---------------------------------------------------------
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameH(el.offsetHeight));
    ro.observe(el);
    setFrameH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Keep the current reel in place when the frame size changes (and on load).
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = indexRef.current * pageH;
  }, [pageH]);

  // ---- persistence: remember if Crumb was turned off ----------------------
  useEffect(() => {
    if (readStore<boolean>(ENABLED_KEY, true) === false) dispatch({ type: "TURN_OFF" });
  }, []);
  useEffect(() => {
    if (crumb.status === "off") writeStore(ENABLED_KEY, false);
    else writeStore(ENABLED_KEY, true);
  }, [crumb.status]);

  // ---- reel change: reset playback and Crumb -------------------------------
  const firstEnter = useRef(true);
  useEffect(() => {
    if (firstEnter.current) firstEnter.current = false;
    else seek(0);
    dispatch({ type: "REEL_ENTER" });
  }, [index, seek]);

  // ---- playback → Crumb: signals become due as the reel plays -------------
  useEffect(() => {
    if (!isListening(crumb.status)) return;
    for (const s of dueSignals(reel.signals, t)) {
      if (!crumb.found.includes(s.id)) dispatch({ type: "SIGNAL_DUE", id: s.id });
    }
  }, [t, reel, crumb.status, crumb.found]);

  // Nothing to find: stop scanning and go quiet.
  useEffect(() => {
    if (crumb.status !== "scanning" || reel.signals.length > 0) return;
    const id = setTimeout(() => dispatch({ type: "SCAN_COMPLETE" }), 2600);
    return () => clearTimeout(id);
  }, [crumb.status, reel.signals.length]);

  // Toasts disappear on their own.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const blocked = captionOpen || crumb.status === "peek" || crumb.menuOpen;

  // ---- vertical feed: native snap scrolling, like the real app ------------
  // The browser does the swipe (momentum, snap, rubber-banding); we only read
  // where it settled. That is what makes it feel like Instagram on a phone.
  const scrollToIndex = useCallback(
    (i: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const target = Math.min(reels.length - 1, Math.max(0, i));
      el.scrollTo({ top: target * pageH, behavior: reduce ? "auto" : "smooth" });
    },
    [pageH, reduce],
  );

  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipingRef = useRef(false);
  const touchingRef = useRef(false);

  // Runs once scrolling has stopped. iOS sometimes leaves a snap unfinished
  // (resting between two reels); if so, glide to the nearest reel ourselves.
  const settle = () => {
    const el = scrollerRef.current;
    if (!el || touchingRef.current) return; // finger still down: wait for touchend
    const next = Math.min(reels.length - 1, Math.max(0, Math.round(el.scrollTop / pageH)));
    if (Math.abs(el.scrollTop - next * pageH) > 2) {
      scrollToIndex(next); // its scroll events lead back here once aligned
      return;
    }
    swipingRef.current = false;
    setSwiping(false);
    if (next !== indexRef.current) {
      indexRef.current = next;
      setIndex(next);
      setPaused(false); // a new reel always starts playing
    }
  };

  const scheduleSettle = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, SETTLE_MS);
  };

  const onScroll = () => {
    if (!swipingRef.current) {
      swipingRef.current = true;
      setSwiping(true);
    }
    scheduleSettle();
  };

  // ---- taps: tap (pause/play), double-tap (like), hold (pause while held) --
  // On touch, the browser cancels the pointer as soon as a swipe starts, so a
  // swipe never counts as a tap. A mouse can drag the feed on desktop.
  const lastTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-interactive]")) return;
    const el = viewportRef.current;
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    if (crumb.menuOpen) {
      dispatch({ type: "CLOSE_MENU" });
      return;
    }
    if (blocked) return;

    const rect = el.getBoundingClientRect();
    const scale = rect.height / el.offsetHeight;
    const isMouse = e.pointerType === "mouse";
    const startY = e.clientY;
    const startScroll = scroller.scrollTop;
    let moved = false;
    let held = false;
    let cancelled = false;
    let lastY = e.clientY;
    let lastT = performance.now();
    let velocity = 0;

    const holdTimer = setTimeout(() => {
      if (!moved && !cancelled) {
        held = true;
        setHolding(true);
      }
    }, 320);

    const move = (ev: PointerEvent) => {
      const dy = (ev.clientY - startY) / scale;
      if (!moved && Math.abs(dy) > 8) {
        moved = true;
        clearTimeout(holdTimer);
        // Mouse drag: scroll by hand, with snapping paused until release.
        if (isMouse) scroller.style.scrollSnapType = "none";
      }
      if (!moved || !isMouse) return;
      scroller.scrollTop = startScroll - dy;
      const now = performance.now();
      velocity = (ev.clientY - lastY) / scale / Math.max(1, now - lastT);
      lastY = ev.clientY;
      lastT = now;
    };

    const end = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      clearTimeout(holdTimer);

      if (held) {
        setHolding(false);
        return;
      }
      // Touch swipe: the browser took over (pointercancel). Nothing to do.
      if (ev.type === "pointercancel") {
        cancelled = true;
        return;
      }
      if (moved) {
        if (isMouse) {
          const dy = (ev.clientY - startY) / scale;
          let next = indexRef.current;
          if (dy < -pageH * 0.18 || velocity < -0.5) next += 1;
          else if (dy > pageH * 0.18 || velocity > 0.5) next -= 1;
          scrollToIndex(next);
          // Turn snapping back on only after the glide, or it yanks back mid-way.
          setTimeout(() => (scroller.style.scrollSnapType = ""), 500);
        }
        return;
      }

      // Tap: wait briefly to see if it's a double tap.
      const now = Date.now();
      if (now - lastTap.current < 280) {
        if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
        lastTap.current = 0;
        setLiked((l) => ({ ...l, [reels[indexRef.current].id]: true }));
        const burst = {
          id: now,
          x: (ev.clientX - rect.left) / scale,
          y: (ev.clientY - rect.top) / scale,
        };
        setBursts((b) => [...b, burst]);
        setTimeout(() => setBursts((b) => b.filter((x) => x.id !== burst.id)), 900);
      } else {
        lastTap.current = now;
        singleTapTimer.current = setTimeout(() => setPaused((p) => !p), 280);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "CLOSE_PEEK" });
        dispatch({ type: "CLOSE_MENU" });
        setCaptionOpen(false);
      }
      if (blocked) return;
      if (e.key === "ArrowDown") scrollToIndex(indexRef.current + 1);
      if (e.key === "ArrowUp") scrollToIndex(indexRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocked, scrollToIndex]);

  // ---- navigation to the Breadcrumb thread --------------------------------
  const openThread = () => {
    const back = `from=${reel.id}&t=${t.toFixed(1)}`;
    router.push(reel.threadId ? `/thread/${reel.threadId}?${back}` : `/thread/new?${back}`);
  };

  // Stable callbacks so the memoised reel chrome doesn't re-render every tick.
  const openCaption = useCallback(() => {
    setCaptionOpen(true);
    dispatch({ type: "CAPTION_OPENED" });
  }, []);
  const toggleLike = useCallback((id: string) => setLiked((l) => ({ ...l, [id]: !l[id] })), []);

  const progress = useTransform(time, (v) => `${(v / reel.durationSec) * 100}%`);
  const sheetTop = Math.round(frameH * SHEET_TOP_RATIO);
  const shrinkScale = (sheetTop - 72) / pageH;
  const crumbActive = crumb.status !== "off" && crumb.status !== "paused";

  const calloutMode =
    crumb.status === "peek"
      ? "peek"
      : crumb.status === "signals" && found.length > 0 && !captionOpen && !swiping && !holding
        ? "chip"
        : "hidden";

  return (
    <div
      ref={viewportRef}
      data-reel={reel.id}
      data-crumb-status={crumb.status}
      data-crumb-found={crumb.found.length}
      className="absolute inset-0 overflow-clip bg-black"
      onPointerDown={onPointerDown}
    >
      {/* Video area: shrinks to the top when the caption sheet opens */}
      <motion.div
        className="absolute inset-x-0 top-0 overflow-clip"
        style={{ bottom: NAV_H, transformOrigin: "50% 0%" }}
        animate={
          captionOpen
            ? { scale: shrinkScale, y: 58, borderRadius: 18 / shrinkScale }
            : { scale: 1, y: 0, borderRadius: 0 }
        }
        transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 380, damping: 40 }}
        onClick={() => captionOpen && setCaptionOpen(false)}
      >
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          onTouchStart={() => (touchingRef.current = true)}
          onTouchEnd={() => {
            touchingRef.current = false;
            scheduleSettle();
          }}
          onTouchCancel={() => {
            touchingRef.current = false;
            scheduleSettle();
          }}
          className="absolute inset-0 snap-y snap-mandatory overscroll-contain"
          style={{ overflowY: blocked ? "hidden" : "scroll", touchAction: "pan-y" }}
        >
          {reels.map((r, i) => {
            // Only the playing reel and its neighbours are drawn; the rest are
            // plain black until you get close. Keeps the phone's GPU free.
            const near = Math.abs(i - index) <= 1;
            return (
              <div key={r.id} className="relative snap-start snap-always" style={{ height: pageH }}>
                {near && (
                  <>
                    <ReelScene
                      reel={r}
                      t={i === index ? t : 0}
                      time={i === index ? time : null}
                      active={i === index}
                    />
                    <motion.div
                      className="absolute inset-0"
                      animate={{ opacity: captionOpen || holding ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ReelChrome
                        reel={r}
                        liked={Boolean(liked[r.id])}
                        onToggleLike={toggleLike}
                        onOpenCaption={openCaption}
                        bottomInset={CHROME_BOTTOM}
                      />
                    </motion.div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-white/20">
          <motion.div className="h-full bg-white/90" style={{ width: progress }} />
        </div>
      </motion.div>

      {/* Double-tap hearts */}
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.span
            key={b.id}
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 text-[#FF3040]"
            style={{ left: b.x, top: b.y }}
            initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
            animate={{ scale: [0.3, 1.25, 1], opacity: [0, 1, 1], rotate: 0 }}
            exit={{ opacity: 0, y: -60, scale: 0.8 }}
            transition={{ duration: 0.45 }}
          >
            <Heart size={96} fill="currentColor" strokeWidth={0} />
          </motion.span>
        ))}
      </AnimatePresence>

      {/* Paused: play icon stays until the next tap */}
      <AnimatePresence>
        {paused && !captionOpen && (
          <motion.div
            key="paused"
            className="pointer-events-none absolute left-1/2 top-[42%] z-30 flex size-[72px] -translate-x-1/2 items-center justify-center rounded-full bg-black/45 text-white"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 1.15 }}
            transition={{ duration: 0.18 }}
          >
            <Play size={32} fill="currentColor" strokeWidth={0} className="translate-x-0.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound toggle */}
      <AnimatePresence>
        {!captionOpen && !holding && (
          <motion.button
            type="button"
            data-interactive
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            className="absolute right-2 z-20 flex size-11 items-center justify-center text-white"
            style={{ top: "calc(var(--top-inset) + 46px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-black/40">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!captionOpen && !holding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TopBar crumbOff={crumb.status === "off"} onTurnOn={() => dispatch({ type: "TURN_ON" })} />
          </motion.div>
        )}
      </AnimatePresence>
      <StatusBar
        crumbStatus={crumb.status}
        onIslandTap={() => {
          if (crumb.status === "off") dispatch({ type: "TURN_ON" });
        }}
      />
      <BottomNav height={NAV_H} />

      <CaptionSheet
        open={captionOpen}
        reel={reel}
        top={sheetTop}
        signals={crumbActive ? reel.signals : []}
        onClose={() => setCaptionOpen(false)}
        onOpenPeek={() => {
          // Show the peek card for everything Crumb can see in this reel.
          for (const s of reel.signals) dispatch({ type: "SIGNAL_DUE", id: s.id });
          setCaptionOpen(false);
          dispatch({ type: "OPEN_PEEK" });
        }}
      />

      {/* ---- Crumb overlay ---- */}
      <CrumbCallout
        mode={calloutMode}
        signals={found}
        thread={thread}
        bottom={CHIP_BOTTOM}
        onOpen={() => dispatch({ type: "OPEN_PEEK" })}
        onClose={() => dispatch({ type: "CLOSE_PEEK" })}
        onSeeThread={openThread}
      />

      <motion.div animate={{ opacity: holding || swiping ? 0.4 : 1 }}>
        <CrumbHandle
          status={crumb.status}
          revealed={crumb.revealed}
          menuOpen={crumb.menuOpen}
          foundCount={crumb.found.length}
          top={HANDLE_TOP}
          onReveal={() => dispatch({ type: "REVEAL" })}
          onTuck={() => dispatch({ type: "TUCK" })}
          onToggleMenu={() => dispatch({ type: "TOGGLE_MENU" })}
          onPauseToggle={() => {
            if (crumb.status === "paused") {
              dispatch({ type: "RESUME" });
              setToast(null);
            } else {
              dispatch({ type: "PAUSE" });
              setToast("paused");
            }
          }}
          onTurnOff={() => {
            dispatch({ type: "TURN_OFF" });
            setToast("off");
          }}
          onOpenBreadcrumb={openThread}
        />
      </motion.div>

      {/* Pause / off confirmation with a way back */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            data-interactive
            className="crumb-type absolute inset-x-3.5 z-40 flex h-12 items-center justify-between rounded-full border border-crumb-hairline-strong bg-crumb-surface pl-5 pr-1.5 text-crumb-ink"
            style={{ bottom: CHIP_BOTTOM }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.24 }}
          >
            <span className="text-[14px] font-medium tracking-tight">
              {toast === "off" ? "Crumb is off" : "Crumb is paused"}
            </span>
            <button
              type="button"
              className="h-9 rounded-full px-3.5 text-[14px] font-medium text-crumb-accent active:bg-crumb-hairline"
              onClick={() => {
                dispatch({ type: toast === "off" ? "TURN_ON" : "RESUME" });
                setToast(null);
              }}
            >
              {toast === "off" ? "Turn on" : "Resume"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
