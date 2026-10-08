"use client";

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, useTransform } from "motion/react";
import { Heart, Play, Volume2, VolumeX } from "lucide-react";
import { reels } from "@/lib/data/reels";
import type { Reel } from "@/lib/types";
import { getThread } from "@/lib/data/threads";
import { ANNOUNCE_MS, LOOK_MS, REST_MS, crumbReducer, initialCrumbState, isListening, shownCount } from "@/lib/crumb-machine";
import { dueSignals, foundSignals } from "@/lib/playback";
import { useReelClock } from "@/lib/use-reel-clock";
import { readStore, writeStore } from "@/lib/storage";
import {
  resumeStepAfterThread,
  shouldStartTutorial,
  tutorialHoldsChip,
  tutorialLocksFeed,
  tutorialPausesReel,
  tutorialReducer,
  type TutorialStep,
} from "@/lib/onboarding";
import { CrumbWidget } from "@/components/crumb/CrumbWidget";
import { TutorialOverlay } from "@/components/onboarding/TutorialOverlay";
import { ReelVideo } from "./ReelVideo";
import { ReelChrome } from "./ReelChrome";
import { CaptionSheet } from "./CaptionSheet";
import { ShareSheet } from "./ShareSheet";
import { BottomNav, HomeIndicator, StatusBar, TopBar } from "./PhoneChrome";

const NAV_H = 76; // floating glass nav: ~24 from the screen bottom + 52 tall
const PROGRESS_BOTTOM = NAV_H + 20; // thin progress line floats above the nav, like Instagram
const CHROME_BOTTOM = PROGRESS_BOTTOM + 8; // creator row and action rail sit above the line
const CHIP_BOTTOM = CHROME_BOTTOM + 104; // above the creator row and caption
const WIDGET_BOTTOM = CHIP_BOTTOM + 16; // Crumb's widget: above the creator row, with breathing room
const SHEET_TOP_RATIO = 0.4;
// Fallback only, for browsers without the "scrollend" event: scroll counts as
// "done" after this long without a scroll event. Long enough that an iPhone
// pausing its updates mid-flick isn't mistaken for the end of the swipe.
const SETTLE_MS = 260;
const HAS_SCROLLEND = typeof window !== "undefined" && "onscrollend" in window;
const ENABLED_KEY = "crumb.enabled";
const FROM_REELS_KEY = "breadcrumb.threadFromReels"; // shared with ThreadView
const TUTORIAL_RESUME_KEY = "crumb.tutorialResume"; // a stage to pick up after a thread

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
  // Opened mid-reel (back from a thread): start already caught up, so what was
  // said before this moment is never re-announced, not even for a frame.
  const [crumb, dispatch] = useReducer(crumbReducer, undefined, () => {
    const start = reels[startIndex];
    const said = startTime > 0 ? dueSignals(start.signals, startTime).map((s) => s.id) : [];
    return crumbReducer(initialCrumbState(true), { type: "CATCH_UP", alreadySaid: said });
  });
  const [muted, setMuted] = useState(true); // until the first tap; see soundChosen
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [toast, setToast] = useState<null | "off">(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null); // "Sent to Jess", "Link copied"
  const [frameH, setFrameH] = useState(844);
  const [tutorial, tutorialDispatch] = useReducer(tutorialReducer, "finished" as TutorialStep);

  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(startIndex);
  const pageH = frameH; // one reel = the full screen; the nav floats on top
  const reel = reels[index];
  const thread = getThread(reel.threadId);
  const found = foundSignals(reel, crumb.found);

  const announcing = crumb.announcing ? found.find((f) => f.id === crumb.announcing) ?? null : null;

  // Every reel's <video>, so the clock can read whichever one is on screen.
  const videos = useRef(new Map<string, HTMLVideoElement>());
  const registerVideo = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) videos.current.set(id, el);
    else videos.current.delete(id);
  }, []);
  const getActiveVideo = useCallback(() => videos.current.get(reels[indexRef.current].id) ?? null, []);
  // Sound: iPhones only allow it after a tap, so reels start muted (which always
  // autoplays) and the first tap anywhere switches sound on instead of pausing.
  // `soundChosen` is set once that happens or the tester uses the sound button.
  const soundChosen = useRef(false);
  const unmuteOnClick = useRef(false);
  const onAutoMuted = useCallback(() => setMuted(true), []);
  useEffect(() => {
    // The unmute itself must run in the "click" the phone treats as the tap.
    const unlock = () => {
      if (!unmuteOnClick.current) return;
      unmuteOnClick.current = false;
      const v = getActiveVideo();
      if (v) {
        v.muted = false;
        v.play().catch(() => {});
      }
      setMuted(false);
    };
    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, [getActiveVideo]);
  const playing = !holding && !paused && !tutorialPausesReel(tutorial);

  const { t, time, seek } = useReelClock(getActiveVideo);

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

  // ---- back from a thread: forget it --------------------------------------
  // After going back, the browser still holds the thread as the "forward"
  // page, and on iPhone a swipe in from the right edge (e.g. pulling the
  // Crumb handle) goes forward and reopens it. Adding a fresh entry for this
  // page wipes that forward page.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(FROM_REELS_KEY) !== "1") return;
      window.sessionStorage.removeItem(FROM_REELS_KEY);
    } catch {
      return;
    }
    window.history.pushState(window.history.state, "", window.location.href);
  }, []);

  // ---- first run: the tutorial, or remember if Crumb was turned off -------
  // Only on the `/onboarding` link (`?tutorial=1`); plain `/reels` skips it.
  useEffect(() => {
    let resume: TutorialStep | null = null;
    try {
      resume = window.sessionStorage.getItem(TUTORIAL_RESUME_KEY) as TutorialStep | null;
      window.sessionStorage.removeItem(TUTORIAL_RESUME_KEY);
    } catch {}
    const start =
      resume ??
      (shouldStartTutorial({
        requested: params.get("tutorial") === "1",
        startIndex,
        startTime,
      })
        ? "listen"
        : null);
    if (start) {
      tutorialDispatch({ type: "START", at: start });
      return; // the tutorial needs Crumb on
    }
    if (readStore<boolean>(ENABLED_KEY, true) === false) dispatch({ type: "TURN_OFF" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Crumb tells the tutorial what the tester just did.
  useEffect(() => {
    if (crumb.announcing) tutorialDispatch({ type: "CRUMB_ANNOUNCED" });
  }, [crumb.announcing]);
  useEffect(() => {
    tutorialDispatch({ type: crumb.open ? "CRUMB_OPENED" : "CRUMB_CLOSED" });
  }, [crumb.open]);
  useEffect(() => {
    tutorialDispatch({ type: crumb.status === "off" ? "CRUMB_OFF" : "CRUMB_ON" });
  }, [crumb.status]);
  useEffect(() => {
    if (crumb.status === "off") writeStore(ENABLED_KEY, false);
    else writeStore(ENABLED_KEY, true);
  }, [crumb.status]);

  // ---- reel change: reset playback and Crumb -------------------------------
  // Rewind only when the reel actually changes (not on first load, where a
  // "come back to this moment" start time applies, and not when React re-runs
  // the effect in development).
  const lastIndex = useRef<number | null>(null);
  useEffect(() => {
    if (lastIndex.current === index) return;
    const first = lastIndex.current === null;
    lastIndex.current = index;
    if (first) return; // the initial state already fits the first reel
    tutorialDispatch({ type: "NEXT_REEL" });
    seek(0);
    dispatch({ type: "REEL_ENTER" });
  }, [index, seek]);

  // Just for fun: a reel's "aside" chip (e.g. 😂 on the joke reel), once per
  // visit, only while Crumb is on and nothing else is showing.
  const [aside, setAside] = useState<Reel["aside"] | null>(null);
  const asideShown = useRef(false);
  useEffect(() => {
    asideShown.current = false;
    setAside(null);
  }, [index]);
  useEffect(() => {
    const a = reel.aside;
    if (!a || asideShown.current || t < a.at || crumb.status === "off" || crumb.open || crumb.announcing || crumb.resting || crumb.looking) return;
    asideShown.current = true;
    setAside(a);
  }, [t, reel.aside, crumb.status, crumb.open, crumb.announcing, crumb.resting, crumb.looking]);
  useEffect(() => {
    if (!aside) return;
    const timer = setTimeout(() => setAside(null), aside.holdMs ?? ANNOUNCE_MS);
    return () => clearTimeout(timer);
  }, [aside]);

  // A flag stretches the widget into a chip for a moment, then it folds back.
  useEffect(() => {
    const id = crumb.announcing;
    if (!id || tutorialHoldsChip(tutorial)) return; // the tutorial waits for a tap
    const timer = setTimeout(() => dispatch({ type: "ANNOUNCE_DONE", id }), ANNOUNCE_MS);
    return () => clearTimeout(timer);
  }, [crumb.announcing, tutorial]);

  // On a new reel (or opening the app), Crumb is seen listening for a few
  // seconds before its first chip, even when a flag is due straight away.
  useEffect(() => {
    if (!crumb.looking) return;
    const timer = setTimeout(() => dispatch({ type: "LOOK_DONE" }), LOOK_MS);
    return () => clearTimeout(timer);
  }, [crumb.looking, index]);

  // ...then rests as a plain widget before the next queued flag gets its turn.
  useEffect(() => {
    if (!crumb.resting) return;
    const timer = setTimeout(() => dispatch({ type: "REST_DONE" }), REST_MS);
    return () => clearTimeout(timer);
  }, [crumb.resting]);

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

  const blocked = captionOpen || shareOpen || crumb.open || tutorialLocksFeed(tutorial);

  // Share confirmations disappear on their own.
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(id);
  }, [notice]);

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
    if (next !== indexRef.current) {
      indexRef.current = next;
      setIndex(next);
      setPaused(false); // a new reel always starts playing
    }
  };

  const armSettle = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, SETTLE_MS);
  };
  const scheduleSettle = () => {
    if (!HAS_SCROLLEND) return armSettle();
    // Scrolling is happening, so "scrollend" will come: drop any fallback check.
    if (settleTimer.current) clearTimeout(settleTimer.current);
  };

  // Settle exactly when the browser says the swipe (including momentum and
  // snap) has finished, instead of guessing from a pause in scroll events.
  const settleRef = useRef(settle);
  settleRef.current = settle;
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !HAS_SCROLLEND) return;
    const onEnd = () => settleRef.current();
    el.addEventListener("scrollend", onEnd);
    return () => el.removeEventListener("scrollend", onEnd);
  }, []);

  const onScroll = () => {
    swipingRef.current = true;
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
        if (!soundChosen.current) {
          // First tap: sound on, keep playing.
          soundChosen.current = true;
          unmuteOnClick.current = true;
          return;
        }
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
        dispatch({ type: "CLOSE" });
        setCaptionOpen(false);
        setShareOpen(false);
      }
      if (blocked) return;
      if (e.key === "ArrowDown") scrollToIndex(indexRef.current + 1);
      if (e.key === "ArrowUp") scrollToIndex(indexRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocked, scrollToIndex]);

  // ---- bring Crumb back: always the plain widget first -------------------
  const turnOn = () => {
    // A just-for-fun aside whose moment has passed counts as shown.
    if (reel.aside && t >= reel.aside.at) asideShown.current = true;
    dispatch({ type: "TURN_ON", alreadySaid: dueSignals(reel.signals, t).map((s) => s.id) });
  };

  // ---- a reel ends: move on to the next one, like the real app -------------
  // If a sheet or the peek card is open, play it again instead of moving the
  // feed out from under the tester.
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  const onReelEnded = useCallback(
    (id: string) => {
      const i = reels.findIndex((r) => r.id === id);
      if (i !== indexRef.current) return;
      if (blockedRef.current) {
        const v = videos.current.get(id);
        if (v) {
          v.currentTime = 0;
          v.play().catch(() => {});
        }
        return;
      }
      scrollToIndex(i + 1);
    },
    [scrollToIndex],
  );

  // ---- navigation to the Breadcrumb thread --------------------------------
  const openThread = () => {
    // Stop the reel the moment Breadcrumb opens, not when the next page lands.
    getActiveVideo()?.pause();
    setPaused(true);
    // Mid-tutorial: carry on with the next stage when the tester comes back.
    if (tutorial === "done") tutorialDispatch({ type: "SKIP" });
    else if (tutorial !== "finished") {
      try {
        window.sessionStorage.setItem(TUTORIAL_RESUME_KEY, resumeStepAfterThread(tutorial));
      } catch {}
    }
    const at = t.toFixed(1);
    // Save where we are in this page's own history entry, so coming back
    // (button or the phone's back swipe) lands on the same reel and moment.
    window.history.replaceState(window.history.state, "", `/reels?reel=${reel.id}&t=${at}`);
    try {
      window.sessionStorage.setItem(FROM_REELS_KEY, "1");
    } catch {}
    const back = `from=${reel.id}&t=${at}`;
    router.push(reel.threadId ? `/thread/${reel.threadId}?${back}` : `/thread/new?${back}`);
  };

  // Stable callbacks so the memoised reel chrome doesn't re-render every tick.
  const openCaption = useCallback(() => {
    setCaptionOpen(true);
    dispatch({ type: "CLOSE" });
  }, []);
  const openShare = useCallback(() => setShareOpen(true), []);
  const toggleLike = useCallback((id: string) => setLiked((l) => ({ ...l, [id]: !l[id] })), []);

  const progress = useTransform(time, (v) => `${(v / reel.durationSec) * 100}%`);
  const sheetTop = Math.round(frameH * SHEET_TOP_RATIO);
  const shrinkScale = (sheetTop - 72) / pageH;
  const crumbActive = crumb.status !== "off";

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
        style={{ bottom: 0, transformOrigin: "50% 0%" }}
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
            armSettle(); // cancelled by the next scroll event if momentum follows
          }}
          onTouchCancel={() => {
            touchingRef.current = false;
            armSettle();
          }}
          className="absolute inset-0 snap-y snap-mandatory overscroll-contain"
          style={{ overflowY: blocked ? "hidden" : "scroll", touchAction: "pan-y" }}
        >
          {reels.map((r, i) => {
            // Every reel stays built so a swipe never waits; only the one on
            // screen plays, and only it and its neighbours load ahead.
            const near = Math.abs(i - index) <= 1;
            return (
              <div key={r.id} className="relative snap-start snap-always" style={{ height: pageH }}>
                <>
                  <ReelVideo
                    reel={r}
                    active={i === index}
                    playing={playing}
                    muted={muted}
                    preload={near}
                    startAt={i === startIndex ? startTime : 0}
                    register={registerVideo}
                    onAutoMuted={onAutoMuted}
                    loop={i === reels.length - 1}
                    onEnded={onReelEnded}
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
                      onShare={openShare}
                      bottomInset={CHROME_BOTTOM}
                    />
                  </motion.div>
                </>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="pointer-events-none absolute inset-x-4 h-[2px] overflow-clip rounded-full bg-white/25" style={{ bottom: PROGRESS_BOTTOM }}>
          <motion.div className="h-full rounded-full bg-white/90" style={{ width: progress }} />
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
            onClick={() => {
              // Set it on the video right away: iPhones only allow sound when
              // it's switched on during the tap itself.
              soundChosen.current = true; // the tester chose, so don't override it
              const v = getActiveVideo();
              if (v) v.muted = !muted;
              setMuted(!muted);
            }}
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
            <TopBar />
          </motion.div>
        )}
      </AnimatePresence>
      <StatusBar
        crumbStatus={crumb.status}
        onIslandTap={() => {
          if (crumb.status === "off") turnOn();
        }}
      />
      <BottomNav />
      <HomeIndicator />

      <ShareSheet open={shareOpen} reel={reel} onClose={() => setShareOpen(false)} onNotice={setNotice} />

      {/* Share confirmation */}
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice}
            role="status"
            className="pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 rounded-full bg-white px-4 py-2.5 text-[14px] font-medium whitespace-nowrap text-black"
            style={{ bottom: CHIP_BOTTOM }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22 }}
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

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
          dispatch({ type: "OPEN" });
        }}
      />

      {/* ---- Crumb: one widget does everything ---- */}
      <CrumbWidget
        status={crumb.status}
        open={crumb.open}
        announcing={announcing}
        aside={crumb.status === "off" || crumb.open ? null : aside}
        found={found}
        shown={shownCount(crumb)}
        reel={reel}
        thread={thread}
        bottom={WIDGET_BOTTOM}
        hidden={captionOpen || shareOpen}
        dimmed={holding}
        onOpen={() => dispatch({ type: "OPEN" })}
        onClose={() => dispatch({ type: "CLOSE" })}
        onTurnOff={() => {
          dispatch({ type: "TURN_OFF" });
          if (tutorial === "finished") setToast("off"); // the tutorial explains it instead
        }}
        onTurnOn={() => {
          turnOn();
          setToast(null);
        }}
        onSeeThread={openThread}
      />

      <TutorialOverlay
        step={tutorial}
        frameRef={viewportRef}
        coachBottom={WIDGET_BOTTOM + 70}
        onSkip={() => tutorialDispatch({ type: "SKIP" })}
      />

      {/* Off confirmation, with the way back */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            data-interactive
            className="crumb-type absolute inset-x-3 z-40 flex items-center justify-between gap-3 rounded-[22px] bg-white py-2.5 pr-2 pl-4 text-crumb-ink"
            style={{ bottom: WIDGET_BOTTOM + 70 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.24 }}
          >
            <span className="min-w-0 leading-tight">
              <span className="block text-[14.5px] font-medium">Crumb is off</span>
              <span className="mt-0.5 block text-[13px] text-crumb-muted">Swipe the tab on the left to bring it back</span>
            </span>
            <button
              type="button"
              className="h-10 shrink-0 rounded-full bg-crumb-ink px-4 text-[14px] font-medium whitespace-nowrap text-white active:opacity-85"
              onClick={() => {
                turnOn();
                setToast(null);
              }}
            >
              Turn on
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
