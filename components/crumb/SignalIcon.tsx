import {
  CircleDollarSign,
  FlaskConical,
  Handshake,
  Link2,
  MessageSquareQuote,
  Package,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SignalKind } from "@/lib/types";

const KIND_ICONS: Record<SignalKind, LucideIcon> = {
  discount_code: TicketPercent,
  affiliate_link: Link2,
  paid_partnership: Handshake,
  health_claim: MessageSquareQuote,
  product_mention: Package,
};

// Each signal kind gets one pastel from the DESIGN.md timeline palette,
// so a kind looks the same in the chip, the caption and the peek card.
export const KIND_TINT: Record<SignalKind, { solid: string; text: string }> = {
  discount_code: { solid: "var(--sig-peach)", text: "var(--crumb-ink)" },
  affiliate_link: { solid: "var(--sig-blue)", text: "var(--crumb-ink)" },
  paid_partnership: { solid: "var(--sig-gold)", text: "#ffffff" },
  health_claim: { solid: "var(--sig-lavender)", text: "var(--crumb-ink)" },
  product_mention: { solid: "var(--sig-mint)", text: "var(--crumb-ink)" },
};

export const TRUST_TINT: Record<"money" | "evidence" | "community", string> = {
  money: "var(--sig-peach)",
  evidence: "var(--sig-lavender)",
  community: "var(--sig-mint)",
};

const TRUST_ICONS: Record<"money" | "evidence" | "community", LucideIcon> = {
  money: CircleDollarSign,
  evidence: FlaskConical,
  community: Users,
};

export function SignalIcon({ kind, size = 13 }: { kind: SignalKind; size?: number }) {
  const Icon = KIND_ICONS[kind];
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}

// A round pastel badge holding a signal kind's icon.
export function KindBadge({ kind, size = 28 }: { kind: SignalKind; size?: number }) {
  const tint = KIND_TINT[kind];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: tint.solid, color: tint.text }}
    >
      <SignalIcon kind={kind} size={Math.round(size * 0.46)} />
    </span>
  );
}

export function TrustIcon({ name, size = 16 }: { name: keyof typeof TRUST_ICONS; size?: number }) {
  const Icon = TRUST_ICONS[name];
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
