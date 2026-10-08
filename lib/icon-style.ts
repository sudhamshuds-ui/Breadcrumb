// A/B test: flag marks as iOS emoji or as line icons. Switch with ?icons=line
// or ?icons=emoji on the link; the choice is remembered on this device.

import type { SignalKind } from "@/lib/types";
import { readStore, writeStore } from "@/lib/storage";

export type IconStyle = "emoji" | "line";

const KEY = "crumb.iconStyle";

export function resolveIconStyle(search: string): IconStyle {
  const asked = new URLSearchParams(search).get("icons");
  if (asked === "emoji" || asked === "line") {
    writeStore(KEY, asked);
    return asked;
  }
  return readStore<IconStyle>(KEY, "emoji");
}

// On iPhones these render as Apple's own emoji.
export const KIND_EMOJI: Record<SignalKind, string> = {
  discount_code: "🏷️",
  affiliate_link: "🔗",
  paid_partnership: "🤝",
  health_claim: "💬",
  product_mention: "📦",
};

export const EVIDENCE_EMOJI = "🔬";
export const COMMUNITY_EMOJI = "👥";
