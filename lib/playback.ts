// Syncs scripted reel data to the current playback time, and turns found
// signals into the short text Crumb shows.

import type { Reel, SceneBeat, Signal, SignalKind, Thread, TranscriptLine } from "@/lib/types";

export function dueSignals(signals: Signal[], t: number): Signal[] {
  return signals.filter((s) => s.appearsAt <= t);
}

export function activeLine(transcript: TranscriptLine[], t: number): TranscriptLine | undefined {
  return transcript.find((l) => t >= l.start && t < l.end);
}

export function activeBeat(beats: SceneBeat[], t: number): SceneBeat | undefined {
  return beats.find((b) => t >= b.start && t < b.end) ?? beats[beats.length - 1];
}

// Words of the active line revealed so far, for karaoke-style captions.
export function wordsShown(line: TranscriptLine, t: number): number {
  const words = line.text.split(" ");
  const progress = (t - line.start) / Math.max(0.1, line.end - line.start);
  return Math.min(words.length, Math.max(1, Math.ceil(progress * words.length * 1.15)));
}

export const MONEY_KINDS: SignalKind[] = ["discount_code", "affiliate_link", "paid_partnership"];

export function isMoney(kind: SignalKind): boolean {
  return MONEY_KINDS.includes(kind);
}

export function foundSignals(reel: Reel, foundIds: string[]): Signal[] {
  return foundIds
    .map((id) => reel.signals.find((s) => s.id === id))
    .filter((s): s is Signal => Boolean(s));
}

// Distinct kinds in the order they were found, used for chip icons.
export function kindsInOrder(signals: Signal[]): SignalKind[] {
  const kinds: SignalKind[] = [];
  for (const s of signals) if (!kinds.includes(s.kind)) kinds.push(s.kind);
  return kinds;
}

// Chip text, at most two parts: "Discount code · 2 claims".
export function chipSummary(signals: Signal[]): string {
  const claims = signals.filter((s) => s.kind === "health_claim");
  const parts: string[] = [];

  const money = moneyTag(signals);
  if (money) parts.push(money);
  if (claims.length > 0) {
    // Short when sharing the chip with a money signal, fuller when alone.
    const n = claims.length === 1 ? "1 claim" : `${claims.length} claims`;
    parts.push(parts.length > 0 ? n : `${n} to check`);
  }
  if (parts.length === 0 && signals.length > 0) parts.push(signals[0].label);
  return parts.join(" · ");
}

// Money signals in a few words, led by the most telling one.
// Used in the chip and beside "Follow" in the caption sheet.
export function moneyTag(signals: Signal[]): string | null {
  const money = signals.filter((s) => isMoney(s.kind));
  if (money.length === 0) return null;
  const lead =
    money.find((s) => s.kind === "discount_code") ??
    money.find((s) => s.kind === "paid_partnership") ??
    money[0];
  return money.length > 1 ? `${lead.label} +${money.length - 1}` : lead.label;
}

export interface CaptionPart {
  text: string;
  signal?: Signal;
}

// Splits a caption so phrases matching a signal can be highlighted.
export function captionParts(caption: string, signals: Signal[]): CaptionPart[] {
  const marks = signals
    .filter((s) => s.captionQuote)
    .map((s) => {
      const at = caption.toLowerCase().indexOf(s.captionQuote!.toLowerCase());
      return { at, len: s.captionQuote!.length, signal: s };
    })
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);

  const parts: CaptionPart[] = [];
  let cursor = 0;
  for (const m of marks) {
    if (m.at < cursor) continue;
    if (m.at > cursor) parts.push({ text: caption.slice(cursor, m.at) });
    parts.push({ text: caption.slice(m.at, m.at + m.len), signal: m.signal });
    cursor = m.at + m.len;
  }
  if (cursor < caption.length) parts.push({ text: caption.slice(cursor) });
  return parts;
}

export interface PeekLine {
  key: "money" | "evidence" | "community";
  title: string;
  line: string;
}

// The three trust signals, never collapsed into one score.
export function peekLines(signals: Signal[], thread: Thread | undefined): PeekLine[] {
  const money = signals.filter((s) => isMoney(s.kind));
  const claims = signals.filter((s) => s.kind === "health_claim");

  let moneyLine = "No money signals found";
  if (thread?.trust.money === "disclosed" || money.some((s) => s.kind === "paid_partnership")) {
    moneyLine = "Paid partnership disclosed";
  } else if (money.length > 0) {
    const labels = money.map((s) => s.label.toLowerCase());
    moneyLine = `${capitalise(joinAnd(labels))} found, no disclosure seen`;
  }

  const evidenceByState: Record<string, string> = {
    supported: "Linked sources support them",
    mixed: "Linked sources are mixed on this",
    not_supported: "Linked sources don't support them yet",
    unknown: "No sources linked yet",
  };
  const evidenceAlone: Record<string, string> = {
    ...evidenceByState,
    supported: "Linked sources support the claims",
    not_supported: "Linked sources don't support the claims",
  };
  const claimCount = claims.length === 1 ? "1 claim" : `${claims.length} claims`;
  // With claims, the sentence refers back to them ("2 claims. Linked sources
  // don't support them yet"); without, it stands alone.
  const evidenceState = thread?.trust.evidence ?? "unknown";
  const evidenceLine =
    claims.length > 0
      ? `${claimCount}. ${evidenceByState[evidenceState]}`
      : evidenceAlone[evidenceState];

  const c = thread?.trust.community;
  const communityLine = c
    ? `${c.reviews} reviews, ${c.positive} positive`
    : "No reviews yet";

  return [
    { key: "money", title: "Money", line: moneyLine },
    { key: "evidence", title: "Evidence", line: evidenceLine },
    { key: "community", title: "Community", line: communityLine },
  ];
}

function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatTime(t: number): string {
  const s = Math.floor(t);
  return `0:${String(s).padStart(2, "0")}`;
}
