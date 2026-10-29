"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  SquarePen,
} from "lucide-react";
import type { Reel, Review, Thread } from "@/lib/types";
import { addMyReview, readMyReviews } from "@/lib/my-reviews";
import { CrumbGlyph } from "@/components/crumb/CrumbGlyph";
import { useIconStyle } from "@/components/crumb/SignalIcon";
import { CareSheet, type CareStart } from "./CareSheet";
import { ReviewSheet } from "./ReviewSheet";
import { WhatPeopleSay } from "./Reviews";
import { ResourcesCard } from "./Resources";
import { CareCard } from "./CareCard";
import { MODAL_LAYER_ID } from "./Modal";
import { ThreadHero } from "./ThreadHero";
import { CrumbSummaryCard, CrumbSummaryModal } from "./CrumbSummary";

// Built for a ~30 second visit as a few cards that open, not a long read:
// what Crumb found, what people say, what the evidence says, then the way to
// a professional. One help CTA at a time: the bottom bar only appears once
// the care card has scrolled out of view.

const SURFACE = "#EDEDED"; // the widget's light surface, used as the page

const FROM_REELS_KEY = "breadcrumb.threadFromReels";

export function ThreadView({ thread, reel }: { thread: Thread; reel: Reel }) {
  const router = useRouter();
  const params = useSearchParams();
  const backUrl = `/reels?reel=${reel.id}&t=${params.get("t") ?? "0"}`;

  const [care, setCare] = useState<CareStart | null>(null);
  const [writing, setWriting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [mine, setMine] = useState<Review[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const iconStyle = useIconStyle();

  // One way to a professional on screen at a time: the bottom bar shows only
  // while the care card is out of view.
  const scrollRef = useRef<HTMLDivElement>(null);
  const careRef = useRef<HTMLElement>(null);
  const [careInView, setCareInView] = useState(true);
  useEffect(() => {
    const root = scrollRef.current;
    const card = careRef.current;
    if (!root || !card) return;
    const io = new IntersectionObserver(([e]) => setCareInView(e.isIntersecting), { root, threshold: 0.2 });
    io.observe(card);
    return () => io.disconnect();
  }, []);

  useEffect(() => setMine(readMyReviews(thread.id)), [thread.id]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2400);
    return () => clearTimeout(id);
  }, [notice]);

  // Back to the reel. Came from the feed: step back in history (the feed then
  // drops this page from "forward", so an edge swipe can't reopen it).
  // Opened from a link: replace this page with the reel.
  const goBack = () => {
    let fromReels = false;
    try {
      fromReels = window.sessionStorage.getItem(FROM_REELS_KEY) === "1";
    } catch {}
    if (fromReels && window.history.length > 1) router.back();
    else router.replace(backUrl);
  };

  return (
    <div className="crumb-type absolute inset-0 text-crumb-ink" style={{ background: SURFACE }}>
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto overscroll-contain pb-[calc(96px+env(safe-area-inset-bottom))]">
        <header
          className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center border-b border-black/5 px-2 pb-2"
          style={{ paddingTop: "calc(var(--top-inset) + 4px)", background: SURFACE }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 items-center gap-0.5 justify-self-start rounded-full pr-3 pl-1 text-[15px] active:bg-crumb-hairline"
          >
            <ChevronLeft size={22} /> Reel
          </button>
          <span className="flex items-center gap-1.5 text-[15px] font-medium">
            <CrumbGlyph size={22} body="#0A0A0A" face={SURFACE} /> Breadcrumb
          </span>
          <span aria-hidden />
        </header>

        <main className="px-3">
          <ThreadHero thread={thread} reel={reel} backUrl={backUrl} />

          {/* What Crumb found: one sentence here, the detail one tap away */}
          <div className="mt-4">
            <CrumbSummaryCard reel={reel} thread={thread} iconStyle={iconStyle} onOpen={() => setSummaryOpen(true)} />
          </div>

          <WhatPeopleSay thread={thread} mine={mine} onWrite={() => setWriting(true)} />

          <ResourcesCard thread={thread} />

          {/* The way to a professional: the main action, last */}
          <CareCard thread={thread} onStart={setCare} cardRef={careRef} />

          <p className="mt-7 mb-4 px-2 text-center text-[13px] leading-normal text-crumb-muted [text-wrap:balance]">
            Moderated thread, checked {thread.lastModerated}. Breadcrumb shares what people and sources say; it doesn&apos;t give
            medical advice.
          </p>
        </main>
      </div>

      {/* The way to a professional, once the care card has scrolled away.
          Never both at once. */}
      <AnimatePresence>
        {!careInView && (
          <motion.div
            key="care-bar"
            className="absolute inset-x-0 bottom-0 z-30 border-t border-black/5 px-4 pt-3"
            style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))", background: SURFACE }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCare("choose")}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-crumb-accent text-[15px] font-medium text-white active:bg-crumb-accent-active"
              >
                Talk to a professional
              </button>
              <button
                type="button"
                onClick={() => setWriting(true)}
                aria-label="Write a review"
                className="flex size-12 items-center justify-center rounded-full bg-white active:bg-crumb-hairline"
              >
                <SquarePen size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice}
            role="status"
            className="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-full bg-crumb-ink px-4 py-2.5 text-[14px] font-medium whitespace-nowrap text-crumb-surface"
            style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <div id={MODAL_LAYER_ID} />
      <CrumbSummaryModal open={summaryOpen} onClose={() => setSummaryOpen(false)} reel={reel} thread={thread} iconStyle={iconStyle} />
      <CareSheet open={care !== null} start={care ?? "choose"} care={thread.care} onClose={() => setCare(null)} />
      <ReviewSheet
        open={writing}
        productName={thread.productName}
        onClose={() => setWriting(false)}
        onPost={(r) => {
          setMine(addMyReview(thread.id, r));
          setWriting(false);
          setNotice("Review posted. Moderators will check it.");
        }}
      />
    </div>
  );
}

