"use client";

import Link from "next/link";
import type { ReelTier, Signal, Thread } from "@/lib/types";
import { avatarFor } from "@/lib/avatars";
import { firstSentence, formatClock } from "@/lib/thread-view";
import { COMMUNITY_EMOJI, EVIDENCE_EMOJI, type IconStyle } from "@/lib/icon-style";
import { inkStyle, KindMark, TrustMark } from "./SignalIcon";

// What Crumb found, laid out once and used in two places: the peek card on
// the reel and the top of the Breadcrumb thread. Keeping one component means
// the card and the page always read the same.

export const EVIDENCE_LINE: Record<Thread["trust"]["evidence"], string> = {
  not_supported: "No supporting evidence linked",
  mixed: "Evidence is mixed",
  supported: "Linked sources support the claims",
  unknown: "No sources linked yet",
};

// Count tag: red for hard flags, amber for facts.
export function CountTag({ tier, count }: { tier: ReelTier; count: number }) {
  const facts = tier !== "flag";
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-[12.5px] font-medium"
      style={facts ? { background: "#FFF1D6", color: "#7A4A00" } : { background: "#FDE4E4", color: "#A61B1B" }}
    >
      {facts ? `${count} stated` : `${count} flagged`}
    </span>
  );
}

// Each flag, then evidence as one more signal. With `hrefFor`, a flag row
// links to its moment in the reel.
export function FindingsList({
  found,
  thread,
  iconStyle,
  hrefFor,
  showQuotes = false,
  className = "",
}: {
  found: Signal[];
  thread: Thread | undefined;
  iconStyle: IconStyle;
  hrefFor?: (s: Signal) => string;
  showQuotes?: boolean; // the exact words, in flowing signal ink (thread page)
  className?: string;
}) {
  return (
    <ul className={"divide-y divide-crumb-hairline rounded-[18px] bg-crumb-surface " + className}>
      {found.map((s) => {
        const body = (
          <>
            <KindMark kind={s.kind} style={iconStyle} size={28} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[14.5px] font-medium">{s.label}</span>
                <span className="shrink-0 text-[12px] text-crumb-muted tabular-nums">{formatClock(s.appearsAt)}</span>
              </div>
              <p className="text-[13px] leading-snug text-crumb-body">{s.detail}</p>
              {showQuotes && (s.quote ?? s.captionQuote) && (
                <p className="mt-1 text-[13.5px] leading-snug text-crumb-muted">
                  &ldquo;
                  <span className="signal-ink on-light font-semibold" style={inkStyle(s.kind, "light")}>
                    {s.quote ?? s.captionQuote}
                  </span>
                  &rdquo;
                </p>
              )}
            </div>
          </>
        );
        return (
          <li key={s.id}>
            {hrefFor ? (
              <Link href={hrefFor(s)} replace className="flex gap-2.5 px-3 py-2.5 active:bg-crumb-hairline/60">
                {body}
              </Link>
            ) : (
              <div className="flex gap-2.5 px-3 py-2.5">{body}</div>
            )}
          </li>
        );
      })}
      {thread && (
        <li className="flex gap-2.5 px-3 py-2.5">
          <TrustMark name="evidence" emoji={EVIDENCE_EMOJI} style={iconStyle} size={28} />
          <div className="min-w-0 flex-1">
            <span className="text-[14.5px] font-medium">{EVIDENCE_LINE[thread.trust.evidence]}</span>
            <p className="line-clamp-2 text-[13px] leading-snug text-crumb-body">{firstSentence(thread.evidenceNote)}</p>
          </div>
        </li>
      )}
    </ul>
  );
}

// People you know and the wider community, in one row.
export function CommunityRow({ thread, iconStyle, className = "" }: { thread: Thread; iconStyle: IconStyle; className?: string }) {
  const c = thread.trust.community;
  const names = thread.friendNames;
  return (
    <div className={"flex items-center gap-3 rounded-[18px] bg-crumb-surface px-3 py-2.5 " + className}>
      {names.length > 0 ? (
        <span className="flex shrink-0 -space-x-2.5">
          {names.slice(0, 3).map((n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={n} src={avatarFor(n)} alt={n} className="size-7 rounded-full object-cover ring-2 ring-crumb-surface" />
          ))}
        </span>
      ) : (
        <TrustMark name="community" emoji={COMMUNITY_EMOJI} style={iconStyle} size={28} />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] leading-snug font-medium">
          {names.length > 0 ? `${joinNames(names)} reviewed this` : "No one you know has reviewed this"}
        </p>
        <p className="text-[12.5px] text-crumb-muted">
          {c.reviews} reviews · {c.positive} positive
        </p>
      </div>
    </div>
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`;
}
