// Small helpers for the thread page.

// 43.3 -> "0:43", 66.9 -> "1:06"
export function formatClock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// The takeaway of a two-sentence summary, shown before the row is opened.
export function firstSentence(text: string): string {
  const m = text.match(/^.+?[.!?](?=\s|$)/);
  return m ? m[0] : text;
}
