"use client";

import { useRef, useState } from "react";
import { ArrowFatUp, ArrowUp, ChatCircle, PencilSimpleLine, Question, SealCheck, ThumbsDown, ThumbsUp, type Icon } from "@phosphor-icons/react";
import type { DiscussionPost, Review, Thread } from "@/lib/types";
import { sortReviews } from "@/lib/my-reviews";
import { addMyReply, readMyReplies } from "@/lib/my-replies";
import { avatarFor, MY_AVATAR } from "@/lib/avatars";
import { Modal } from "./Modal";

// "What people say": health professionals first, then you, friends, contacts
// and everyone else, as cards you swipe sideways. Tap one to read it in full
// with its replies; "View all" opens the overall picture and every review.

type Voice = { kind: "pro"; post: DiscussionPost } | { kind: "review"; review: Review };

const voiceId = (v: Voice) => (v.kind === "pro" ? v.post.id : v.review.id);

export function voicesFor(thread: Thread, mine: Review[]): Voice[] {
  const pros: Voice[] = thread.discussion.filter((d) => d.role).map((post) => ({ kind: "pro", post }));
  const reviews: Voice[] = sortReviews([...mine, ...thread.reviews]).map((review) => ({ kind: "review", review }));
  return [...pros, ...reviews];
}

const VERDICT: Record<NonNullable<Review["verdict"]>, { text: string; icon: Icon; color: string }> = {
  worth_it: { text: "Worth it", icon: ThumbsUp, color: "#1F6B4A" },
  not_worth_it: { text: "Not worth it", icon: ThumbsDown, color: "#A61B1B" },
  unsure: { text: "Not sure", icon: Question, color: "#6e6b62" },
};
const BOUGHT_LABEL = { yes: "Bought it", no: "Didn't buy", considering: "Thinking about it" } as const;

export function WhatPeopleSay({
  thread,
  mine,
  onWrite,
}: {
  thread: Thread;
  mine: Review[];
  onWrite: () => void;
}) {
  const voices = voicesFor(thread, mine);
  const [openId, setOpenId] = useState<string | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const opened = voices.find((v) => voiceId(v) === openId);
  const { dragged, ...dragHandlers } = useMouseDrag();

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-[24px] leading-tight tracking-[-0.02em]">What people say</h2>
        <button type="button" onClick={() => setAllOpen(true)} className="-mr-1 h-11 px-1 text-[14px] font-medium text-crumb-accent">
          View all
        </button>
      </div>

      <ul
        {...dragHandlers}
        className="-mx-3 mt-2 flex cursor-grab snap-x snap-mandatory scroll-px-3 gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Reviews"
      >
        {voices.map((v) => (
          <li key={voiceId(v)} className="w-[78%] shrink-0 snap-start">
            <button
              type="button"
              onClick={() => !dragged() && setOpenId(voiceId(v))}
              className="flex h-full w-full flex-col rounded-[22px] bg-white p-3.5 text-left transition-transform duration-150 active:scale-[0.98]"
            >
              <VoiceHeader voice={v} />
              <p className="mt-2.5 line-clamp-3 text-[14.5px] leading-snug">{v.kind === "pro" ? v.post.text : v.review.text}</p>
              <span className="mt-auto pt-3">
                <VoiceFooter voice={v} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Modal open={!!opened} title={opened?.kind === "pro" ? "From a professional" : "Review"} onClose={() => setOpenId(null)}>
        {opened && <VoiceFull voice={opened} threadId={thread.id} replyOpen />}
      </Modal>

      <AllReviewsModal
        open={allOpen}
        onClose={() => setAllOpen(false)}
        thread={thread}
        voices={voices}
        onWrite={() => {
          setAllOpen(false);
          onWrite();
        }}
      />
    </section>
  );
}

// Face, name, when, and for professionals the verified badge. Nothing else
// on the card: what someone decided shows once their review is opened.
function VoiceHeader({ voice: v }: { voice: Voice }) {
  const name = v.kind === "pro" ? v.post.author : v.review.author;
  const avatar = v.kind === "review" && v.review.mine ? MY_AVATAR : avatarFor(name);
  const ago = v.kind === "pro" ? v.post.postedAgo : v.review.postedAgo;
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[15px] font-medium">{name}</span>
          <span className="ml-auto shrink-0 text-[13px] text-crumb-muted">{ago}</span>
        </span>
        {v.kind === "pro" && <Verified role={v.post.role} />}
      </span>
    </span>
  );
}

function Verified({ role }: { role?: string }) {
  return (
    <span className="flex items-center gap-1 text-[13px] font-medium text-[#1f8a65]">
      <SealCheck size={15} weight="duotone" /> Verified {role?.toLowerCase()}
    </span>
  );
}

function VoiceFooter({ voice: v }: { voice: Voice }) {
  if (v.kind === "pro") {
    const replies = v.post.replies?.length ?? 0;
    return (
      <span className="flex items-center gap-3 text-[13px] text-crumb-muted">
        <span className="flex items-center gap-1">
          <ArrowFatUp size={15} /> {v.post.votes}
        </span>
        {replies > 0 && (
          <span className="flex items-center gap-1">
            <ChatCircle size={14} /> {replies} {replies === 1 ? "reply" : "replies"}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[13px] text-crumb-muted">
      {v.review.mine ? (
        "Waiting for moderation"
      ) : (
        <>
          <ThumbsUp size={14} /> {v.review.helpful} found helpful
        </>
      )}
    </span>
  );
}

// One review or professional answer, in full, as a thread: the post, its
// replies joined by a line, and a box to reply. "Reply" on any post opens
// the box addressed to that person. Your replies stay on this phone and
// wait for moderation.
function VoiceFull({ voice: v, threadId, replyOpen = false }: { voice: Voice; threadId: string; replyOpen?: boolean }) {
  const rootId = voiceId(v);
  const rootName = v.kind === "pro" ? v.post.author : v.review.author;
  const [mine, setMine] = useState(() => readMyReplies(threadId, rootId));
  const [replying, setReplying] = useState(replyOpen);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const replies = [...(v.kind === "pro" ? (v.post.replies ?? []) : []), ...mine];

  const replyTo = (name: string) => {
    setReplying(true);
    setDraft(name === rootName ? "" : `@${name} `);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const root =
    v.kind === "pro"
      ? { author: v.post.author, postedAgo: v.post.postedAgo }
      : { author: v.review.author, postedAgo: v.review.postedAgo, mine: v.review.mine };

  return (
    <div className="rounded-[22px] bg-white p-4">
      <ThreadPost post={root} avatar={36} joined={replies.length > 0}>
        {v.kind === "pro" ? (
          <>
            <Verified role={v.post.role} />
            <p className="mt-2 text-[15px] leading-normal">{v.post.text}</p>
            <Actions onReply={() => replyTo(rootName)}>
              <Upvote post={v.post} />
            </Actions>
          </>
        ) : (
          <>
            <p className="mt-1 text-[15px] leading-normal">{v.review.text}</p>
            <ReviewChips review={v.review} />
            {v.review.mine ? (
              <p className="mt-2 text-[13px] text-crumb-muted">Waiting for moderation</p>
            ) : (
              <Actions onReply={() => replyTo(rootName)}>
                <Helpful review={v.review} />
              </Actions>
            )}
          </>
        )}
      </ThreadPost>

      {replies.map((r, i) => (
        <ThreadPost key={r.id} post={r} avatar={28} joined={i < replies.length - 1}>
          {r.role && <Verified role={r.role} />}
          <p className="mt-1 text-[14.5px] leading-normal">{r.text}</p>
          {r.mine ? (
            <p className="mt-1 text-[13px] text-crumb-muted">Waiting for moderation</p>
          ) : (
            <Actions onReply={() => replyTo(r.author)} />
          )}
        </ThreadPost>
      ))}

      {replying && (
        <form
          className="mt-3 flex items-center gap-2 border-t border-crumb-hairline pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            setMine(addMyReply(threadId, rootId, draft));
            setDraft("");
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MY_AVATAR} alt="" className="size-7 shrink-0 rounded-full object-cover" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Reply to ${rootName}`}
            aria-label={`Reply to ${rootName}`}
            className="h-10 min-w-0 flex-1 rounded-full bg-crumb-surface px-4 text-[16px] outline-none placeholder:text-crumb-muted focus:ring-2 focus:ring-crumb-hairline-strong"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send reply"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-crumb-accent text-white transition-opacity disabled:opacity-30"
          >
            <ArrowUp size={18} weight="bold" />
          </button>
        </form>
      )}
    </div>
  );
}

// What the reviewer decided, shown once their review is opened.
function ReviewChips({ review: r }: { review: Review }) {
  const verdict = r.verdict ? VERDICT[r.verdict] : null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5 text-[13px] font-medium">
      {verdict && (
        <span className="flex items-center gap-1 rounded-full bg-crumb-surface px-2.5 py-1" style={{ color: verdict.color }}>
          <verdict.icon size={14} weight="duotone" /> {verdict.text}
        </span>
      )}
      <span className="rounded-full bg-crumb-surface px-2.5 py-1 text-crumb-body">{BOUGHT_LABEL[r.bought]}</span>
    </div>
  );
}

// The row under a post: its own action (upvote, helpful) and Reply.
function Actions({ onReply, children }: { onReply: () => void; children?: React.ReactNode }) {
  return (
    <div className="mt-1 -ml-1 flex items-center gap-3">
      {children}
      <button
        type="button"
        onClick={onReply}
        className="flex h-9 items-center gap-1 px-1 text-[13.5px] font-medium text-crumb-muted active:text-crumb-ink"
      >
        <ChatCircle size={14} /> Reply
      </button>
    </div>
  );
}

function ThreadPost({
  post,
  avatar,
  joined,
  children,
}: {
  post: { author: string; postedAgo: string; mine?: boolean };
  avatar: number;
  joined: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-9 shrink-0 flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.mine ? MY_AVATAR : avatarFor(post.author)}
          alt=""
          className="shrink-0 rounded-full object-cover"
          style={{ width: avatar, height: avatar }}
        />
        {joined && <span className="my-1.5 w-px flex-1 bg-crumb-hairline-strong" aria-hidden />}
      </div>
      <div className={"min-w-0 flex-1 " + (joined ? "pb-2" : "")}>
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[15px] font-medium">{post.author}</span>
          <span className="ml-auto shrink-0 text-[13px] text-crumb-muted">{post.postedAgo}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Helpful({ review }: { review: Review }) {
  const [helped, setHelped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setHelped((h) => !h)}
      aria-pressed={helped}
      className={"flex h-9 items-center gap-1.5 px-1 text-[13.5px] " + (helped ? "text-crumb-ink" : "text-crumb-muted")}
    >
      <ThumbsUp size={15} weight={helped ? "fill" : "regular"} /> Helpful · {review.helpful + (helped ? 1 : 0)}
    </button>
  );
}

function Upvote({ post }: { post: DiscussionPost }) {
  const [voted, setVoted] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setVoted((v) => !v)}
      aria-pressed={voted}
      aria-label={`Upvote, ${post.votes + (voted ? 1 : 0)} votes`}
      className={"flex h-9 items-center gap-1 px-1 text-[13.5px] " + (voted ? "text-crumb-accent" : "text-crumb-muted")}
    >
      <ArrowFatUp size={17} weight={voted ? "fill" : "regular"} /> {post.votes + (voted ? 1 : 0)}
    </button>
  );
}

// The overall picture first, like a shop's review page: how many were
// positive, who you know, what most people say. Then every card.
function AllReviewsModal({
  open,
  onClose,
  thread,
  voices,
  onWrite,
}: {
  open: boolean;
  onClose: () => void;
  thread: Thread;
  voices: Voice[];
  onWrite: () => void;
}) {
  const c = thread.trust.community;
  const friends = thread.friendNames;
  return (
    <Modal open={open} title="What people say" onClose={onClose}>
      <div className="rounded-[22px] bg-white p-4">
        <p className="flex items-baseline gap-2">
          <span className="text-[34px] leading-none tracking-[-0.03em] tabular-nums">
            {c.positive} of {c.reviews}
          </span>
          <span className="text-[14px] text-crumb-muted">reviews positive</span>
        </p>
        <div className="mt-3 flex gap-1" aria-hidden>
          {Array.from({ length: c.reviews }, (_, i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < c.positive ? "#F5A623" : "#E6E5E0" }} />
          ))}
        </div>
        {friends.length > 0 && (
          <div className="mt-3.5 flex items-center gap-2">
            <span className="flex -space-x-2">
              {friends.slice(0, 3).map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={n} src={avatarFor(n)} alt="" className="size-6 rounded-full object-cover ring-2 ring-white" />
              ))}
            </span>
            <span className="text-[13.5px] text-crumb-body">{friends.join(" and ")} reviewed this</span>
          </div>
        )}
        {thread.reviewSummary && (
          <p className="mt-3.5 border-t border-crumb-hairline pt-3.5 text-[15px] leading-snug">{thread.reviewSummary}</p>
        )}
        <button
          type="button"
          onClick={onWrite}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-crumb-surface text-[14.5px] font-medium active:bg-crumb-hairline"
        >
          <PencilSimpleLine size={17} /> Write a review
        </button>
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {voices.map((v) => (
          <li key={voiceId(v)}>
            <VoiceFull voice={v} threadId={thread.id} />
          </li>
        ))}
      </ul>
    </Modal>
  );
}

// Phones swipe the row by touch; with a mouse there's no sideways scroll, so
// let a mouse drag it too. Snapping is paused while dragging and a drag never
// counts as a tap on a card.
function useMouseDrag() {
  const start = useRef<{ x: number; left: number } | null>(null);
  const moved = useRef(false);
  return {
    dragged: () => moved.current,
    onPointerDown: (e: React.PointerEvent<HTMLUListElement>) => {
      if (e.pointerType !== "mouse") return;
      start.current = { x: e.clientX, left: e.currentTarget.scrollLeft };
      moved.current = false;
    },
    onPointerMove: (e: React.PointerEvent<HTMLUListElement>) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      if (!moved.current && Math.abs(dx) < 5) return;
      if (!moved.current) {
        moved.current = true;
        e.currentTarget.style.scrollSnapType = "none";
        e.currentTarget.style.cursor = "grabbing";
      }
      e.currentTarget.scrollLeft = start.current.left - dx;
    },
    onPointerUp: (e: React.PointerEvent<HTMLUListElement>) => endDrag(e.currentTarget),
    onPointerLeave: (e: React.PointerEvent<HTMLUListElement>) => endDrag(e.currentTarget),
  };

  function endDrag(el: HTMLUListElement) {
    if (!start.current) return;
    start.current = null;
    el.style.cursor = "";
    if (!moved.current) return;
    // Land on the nearest card, then let snapping take over again
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 8 : el.clientWidth;
    el.scrollTo({ left: Math.round(el.scrollLeft / step) * step, behavior: "smooth" });
    setTimeout(() => {
      el.style.scrollSnapType = "";
      moved.current = false;
    }, 350);
  }
}
