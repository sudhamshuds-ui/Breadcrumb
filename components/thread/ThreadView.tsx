"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowBigUp,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  Phone,
  PhoneCall,
  Play,
  SquarePen,
  ThumbsUp,
} from "lucide-react";
import type { DiscussionPost, Reel, Review, Thread } from "@/lib/types";
import { peekLines } from "@/lib/playback";
import { firstSentence, formatClock } from "@/lib/thread-view";
import { addMyReview, readMyReviews, relationOf, sortReviews } from "@/lib/my-reviews";
import { avatarFor, MY_AVATAR } from "@/lib/avatars";
import { HEALTHDIRECT_PHONE, HEALTHDIRECT_TEL } from "@/lib/data/care";
import { CrumbGlyph } from "@/components/crumb/CrumbGlyph";
import { KindBadge, TRUST_TINT, TrustIcon } from "@/components/crumb/SignalIcon";
import { CareSheet, type CareStart } from "./CareSheet";
import { ReviewSheet } from "./ReviewSheet";

// Built for a ~30 second visit: the three signals and the way to a
// professional come first; people you know next; sources one tap deep;
// everything else folded under "More on this thread".

const FROM_REELS_KEY = "breadcrumb.threadFromReels";

const EVIDENCE_TAG: Record<Thread["trust"]["evidence"], string> = {
  supported: "Supported",
  mixed: "Mixed",
  not_supported: "Not supported yet",
  unknown: "No sources yet",
};
const MONEY_TAG: Record<Thread["trust"]["money"], string> = {
  disclosed: "Disclosed",
  detected: "Detected",
  none_found: "None found",
};

export function ThreadView({ thread, reel }: { thread: Thread; reel: Reel }) {
  const router = useRouter();
  const params = useSearchParams();
  const backUrl = `/reels?reel=${reel.id}&t=${params.get("t") ?? "0"}`;

  const [care, setCare] = useState<CareStart | null>(null);
  const [writing, setWriting] = useState(false);
  const [mine, setMine] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const c = thread.trust.community;
  const reviews = useMemo(() => sortReviews([...mine, ...thread.reviews]), [mine, thread.reviews]);
  const known = reviews.filter((r) => r.mine || relationOf(r) === "friend");
  const shownReviews = allReviews ? reviews : known;
  const topAnswer = thread.discussion.find((d) => d.role) ?? thread.discussion[0];
  const discussionCount = thread.discussion.reduce((n, d) => n + 1 + (d.replies?.length ?? 0), 0);

  return (
    <div className="crumb-type absolute inset-0 bg-crumb-surface text-crumb-ink">
      <div className="absolute inset-0 overflow-y-auto overscroll-contain pb-[calc(96px+env(safe-area-inset-bottom))]">
        <header
          className="sticky top-0 z-20 flex items-center justify-between border-b border-crumb-hairline bg-crumb-surface px-2 pb-2"
          style={{ paddingTop: "calc(var(--top-inset) + 4px)" }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 items-center gap-0.5 rounded-full pr-3 pl-1 text-[15px] active:bg-crumb-hairline"
          >
            <ChevronLeft size={22} /> Reel
          </button>
          <span className="flex items-center gap-1.5 text-[15px] font-medium">
            <CrumbGlyph size={16} /> Breadcrumb
          </span>
          <span className="w-[72px]" aria-hidden />
        </header>

        <main className="px-4">
          {/* The post: what this thread is about */}
          <Link href={backUrl} replace className="mt-4 flex items-center gap-3 active:opacity-70">
            <span
              className="relative h-[76px] w-[46px] shrink-0 overflow-hidden rounded-[10px] bg-crumb-ink"
              style={{ backgroundImage: `url(${reel.poster})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                <Play size={14} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
            <span className="min-w-0">
              <h1 className="text-[24px] leading-[1.15] tracking-[-0.02em] [text-wrap:balance]">{thread.productName}</h1>
              <span className="mt-1 block truncate text-[13px] text-crumb-muted">
                {reel.creator.handle}
                {reel.paidPartner && ` · Paid partnership with ${reel.paidPartner}`}
              </span>
            </span>
          </Link>

          {/* Three signals, never one score */}
          <section className="mt-6">
            <h2 className="text-[19px] tracking-[-0.01em]">
              {reel.tier === "flag" ? "What Crumb found" : "What this post states"}
            </h2>
            <div className="mt-3 divide-y divide-crumb-hairline rounded-[22px] bg-crumb-card ring-1 ring-crumb-hairline">
              <SignalRow name="money" title="Money" tag={MONEY_TAG[thread.trust.money]} line={peekLines(reel.signals, thread)[0].line} />
              <SignalRow name="evidence" title="Evidence" tag={EVIDENCE_TAG[thread.trust.evidence]} line={thread.evidenceNote} />
              <SignalRow
                name="community"
                title="Community"
                tag={`${c.positive} of ${c.reviews} positive`}
                line={
                  thread.friendNames.length > 0
                    ? `${joinNames(thread.friendNames)} reviewed this`
                    : "No one you know has reviewed this yet"
                }
                faces={thread.friendNames}
              />
            </div>
          </section>

          {/* The way to a professional: the main action */}
          <section className="mt-4 rounded-[28px] bg-crumb-ink p-5 text-crumb-surface">
            <h2 className="text-[21px] leading-tight tracking-[-0.015em] [text-wrap:balance]">
              Talk to a professional about {thread.care.topic}
            </h2>
            <p className="mt-2 text-[14px] leading-normal text-crumb-surface/80">{thread.care.first}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setCare("clinic")}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-crumb-accent text-[15px] font-medium text-white active:bg-crumb-accent-active"
              >
                <CalendarCheck size={18} /> Book a GP appointment
              </button>
              <button
                type="button"
                onClick={() => setCare("call")}
                className="flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-medium ring-1 ring-crumb-surface/30 active:bg-crumb-surface/10"
              >
                <PhoneCall size={18} /> Schedule a call
              </button>
              <a
                href={HEALTHDIRECT_TEL}
                className="flex h-11 items-center justify-center gap-2 rounded-full text-[14px] text-crumb-surface/85 active:bg-crumb-surface/10"
              >
                <Phone size={16} /> Call healthdirect, {HEALTHDIRECT_PHONE}, free 24/7
              </a>
            </div>
          </section>

          {/* Reviews: people you know, then everyone on request */}
          <section className="mt-8">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[19px] tracking-[-0.01em]">
                {allReviews ? `All reviews (${reviews.length})` : "People you know"}
              </h2>
              <button type="button" onClick={() => setWriting(true)} className="text-[14px] font-medium text-crumb-accent">
                Write a review
              </button>
            </div>
            {shownReviews.length > 0 ? (
              <div className="mt-3 divide-y divide-crumb-hairline rounded-[22px] bg-crumb-card ring-1 ring-crumb-hairline">
                {shownReviews.map((r) => (
                  <ReviewRow key={r.id} review={r} />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[14px] text-crumb-body">No one you know has reviewed this yet.</p>
            )}
            {reviews.length > known.length && (
              <button
                type="button"
                onClick={() => setAllReviews((a) => !a)}
                className="mt-2 h-10 text-[14px] font-medium text-crumb-ink underline decoration-crumb-hairline-strong underline-offset-4"
              >
                {allReviews ? "Show people you know only" : `See all ${reviews.length} reviews`}
              </button>
            )}
          </section>

          {/* Sources: the takeaway up front, the detail one tap away */}
          <section className="mt-8">
            <h2 className="text-[19px] tracking-[-0.01em]">What the evidence says</h2>
            <div className="mt-3 divide-y divide-crumb-hairline rounded-[22px] bg-crumb-card ring-1 ring-crumb-hairline">
              {thread.sources.map((src) => (
                <Fold
                  key={src.url}
                  title={src.title}
                  meta={[src.type, src.publisher, src.year].filter(Boolean).join(" · ")}
                  preview={firstSentence(src.summary)}
                >
                  <p className="text-[14px] leading-normal text-crumb-body">{src.summary}</p>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex h-9 items-center gap-1 text-[14px] font-medium text-crumb-accent"
                  >
                    Read the source <ArrowUpRight size={15} />
                  </a>
                </Fold>
              ))}
            </div>
          </section>

          {/* Depth for those who want it */}
          <section className="mt-8">
            <h2 className="text-[19px] tracking-[-0.01em]">More on this thread</h2>
            <div className="mt-3 divide-y divide-crumb-hairline rounded-[22px] bg-crumb-card ring-1 ring-crumb-hairline">
              {reel.signals.length > 0 && (
                <Fold title="Moments in the reel" meta={`${reel.signals.length} found`}>
                  <div className="flex flex-col gap-1">
                    {reel.signals.map((s) => (
                      <Link
                        key={s.id}
                        href={`/reels?reel=${reel.id}&t=${Math.max(0, s.appearsAt - 1).toFixed(1)}`}
                        replace
                        className="-mx-2 flex gap-3 rounded-2xl p-2 active:bg-crumb-surface"
                      >
                        <KindBadge kind={s.kind} size={28} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2 text-[14px] font-medium">
                            {s.label}
                            <span className="text-[13px] font-normal text-crumb-muted tabular-nums">{formatClock(s.appearsAt)}</span>
                          </span>
                          {(s.quote || s.captionQuote) && (
                            <span className="mt-0.5 block text-[13px] leading-snug text-crumb-body">
                              &ldquo;{s.quote ?? s.captionQuote}&rdquo;
                            </span>
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                </Fold>
              )}

              <Fold title="About the creator" meta={thread.creator.note}>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  <Stat value={String(thread.creator.postsReviewed)} label="posts reviewed" />
                  <Stat value={String(thread.creator.postsFlagged)} label="with signals" />
                  <Stat
                    value={thread.creator.disclosed ? `${thread.creator.disclosed[0]} of ${thread.creator.disclosed[1]}` : "n/a"}
                    label="ads disclosed"
                  />
                </dl>
                <p className="mt-2 text-[13px] text-crumb-muted">Each post is judged on its own, never as one creator score.</p>
              </Fold>

              {topAnswer && (
                <Fold
                  title={`Discussion (${discussionCount})`}
                  meta={topAnswer.role ? `Top answer from a verified ${topAnswer.role.toLowerCase()}` : undefined}
                  preview={topAnswer.text}
                >
                  <div className="flex flex-col divide-y divide-crumb-hairline">
                    {thread.discussion.map((d) => (
                      <Post key={d.id} post={d} />
                    ))}
                  </div>
                </Fold>
              )}
            </div>
          </section>

          <p className="mt-8 mb-4 text-center text-[13px] leading-normal text-crumb-muted [text-wrap:balance]">
            Moderated thread, checked {thread.lastModerated}. Breadcrumb shares what people and sources say; it doesn&apos;t give
            medical advice.
          </p>
        </main>
      </div>

      {/* Always within reach */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 border-t border-crumb-hairline bg-crumb-surface px-4 pt-3"
        style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
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
            className="flex size-12 items-center justify-center rounded-full bg-crumb-card ring-1 ring-crumb-hairline-strong active:bg-crumb-hairline"
          >
            <SquarePen size={18} />
          </button>
        </div>
      </div>

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

function SignalRow({
  name,
  title,
  tag,
  line,
  faces,
}: {
  name: "money" | "evidence" | "community";
  title: string;
  tag: string;
  line: string;
  faces?: string[];
}) {
  return (
    <div className="flex gap-3 p-3.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-crumb-ink" style={{ background: TRUST_TINT[name] }}>
        <TrustIcon name={name} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[15px] font-medium">{title}</span>
          <span className="text-[13px] font-medium">{tag}</span>
        </div>
        <p className="mt-0.5 text-[14px] leading-snug text-crumb-body">{line}</p>
        {faces && faces.length > 0 && (
          <div className="mt-2 flex -space-x-2">
            {faces.map((n) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={n} src={avatarFor(n)} alt={n} className="size-6 rounded-full object-cover ring-2 ring-crumb-card" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// A row that opens in place. One tap deep, never more.
function Fold({ title, meta, preview, children }: { title: string; meta?: string; preview?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full gap-3 p-3.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-snug font-medium">{title}</span>
          {meta && <span className="mt-0.5 block text-[13px] text-crumb-muted">{meta}</span>}
          {preview && !open && <span className="mt-1 line-clamp-2 block text-[14px] leading-snug text-crumb-body">{preview}</span>}
        </span>
        <ChevronDown
          size={18}
          className="mt-0.5 shrink-0 text-crumb-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-crumb-surface px-1 py-2.5">
      <dd className="text-[19px] leading-none tracking-[-0.01em] tabular-nums">{value}</dd>
      <dt className="mt-1 text-[12px] text-crumb-muted">{label}</dt>
    </div>
  );
}

const RELATION_LABEL = { friend: "Friend", contact: "In your contacts", peer: null } as const;
const BOUGHT_LABEL = { yes: "Bought it", no: "Didn't buy", considering: "Thinking about it" } as const;
const VERDICT_LABEL = { worth_it: "Worth it", not_worth_it: "Not worth it", unsure: "Not sure" } as const;

function ReviewRow({ review: r }: { review: Review }) {
  const [helped, setHelped] = useState(false);
  const relation = RELATION_LABEL[relationOf(r)];
  return (
    <article className="p-3.5">
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.mine ? MY_AVATAR : avatarFor(r.author)} alt="" className="size-8 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[15px] font-medium">
            <span className="truncate">{r.author}</span>
            {r.mine ? <Tag>Waiting for moderation</Tag> : relation && <Tag strong>{relation}</Tag>}
          </div>
          <div className="text-[13px] text-crumb-muted">
            {BOUGHT_LABEL[r.bought]}
            {r.verdict && ` · ${VERDICT_LABEL[r.verdict]}`} · {r.postedAgo}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[14px] leading-normal">{r.text}</p>
      {!r.mine && (
        <button
          type="button"
          onClick={() => setHelped((h) => !h)}
          aria-pressed={helped}
          className={"mt-1 -ml-1 flex h-9 items-center gap-1.5 rounded-full px-1 text-[13px] " + (helped ? "text-crumb-ink" : "text-crumb-muted")}
        >
          <ThumbsUp size={14} fill={helped ? "currentColor" : "none"} /> Helpful · {r.helpful + (helped ? 1 : 0)}
        </button>
      )}
    </article>
  );
}

function Post({ post, reply }: { post: DiscussionPost; reply?: boolean }) {
  const [voted, setVoted] = useState(false);
  return (
    <div className={reply ? "mt-3 border-l border-crumb-hairline-strong pl-3" : "py-3 first:pt-0 last:pb-0"}>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarFor(post.author)} alt="" className="size-6 rounded-full object-cover" />
        <span className="truncate text-[14px] font-medium">{post.author}</span>
        {post.role && (
          <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-[#1f8a65]">
            <BadgeCheck size={14} /> {post.role}
          </span>
        )}
        {post.isFriend && <Tag strong>Friend</Tag>}
        <span className="ml-auto shrink-0 text-[13px] text-crumb-muted">{post.postedAgo}</span>
      </div>
      <p className="mt-1.5 text-[14px] leading-normal">{post.text}</p>
      <button
        type="button"
        onClick={() => setVoted((v) => !v)}
        aria-pressed={voted}
        aria-label={`Upvote, ${post.votes + (voted ? 1 : 0)} votes`}
        className={"mt-1 -ml-1 flex h-9 items-center gap-1 px-1 text-[13px] " + (voted ? "text-crumb-accent" : "text-crumb-muted")}
      >
        <ArrowBigUp size={18} fill={voted ? "currentColor" : "none"} /> {post.votes + (voted ? 1 : 0)}
      </button>
      {post.replies?.map((r) => (
        <Post key={r.id} post={r} reply />
      ))}
    </div>
  );
}

function Tag({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <span
      className={
        "shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium " +
        (strong ? "bg-crumb-ink text-crumb-surface" : "bg-crumb-surface text-crumb-body ring-1 ring-crumb-hairline")
      }
    >
      {children}
    </span>
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
