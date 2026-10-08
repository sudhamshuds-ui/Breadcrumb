import { useEffect, useState } from "react";
import { KIND_EMOJI, resolveIconStyle, type IconStyle } from "@/lib/icon-style";
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

// ---- Flag marks: emoji or line icon (A/B test, see lib/icon-style.ts) ----


export function useIconStyle(): IconStyle {
  const [style, setStyle] = useState<IconStyle>("emoji");
  useEffect(() => setStyle(resolveIconStyle(window.location.search)), []);
  return style;
}

// A signal's mark on a soft tile of its pastel. Emoji sit on a lighter tint so
// their own colours read; line icons keep the solid pastel badge.
export function KindMark({ kind, style, size = 32 }: { kind: SignalKind; style: IconStyle; size?: number }) {
  if (style === "line") return <KindBadge kind={kind} size={size} />;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full leading-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.52),
        background: `color-mix(in srgb, ${KIND_TINT[kind].solid} 28%, white)`,
      }}
      aria-hidden="true"
    >
      {KIND_EMOJI[kind]}
    </span>
  );
}

// Same tile for the non-signal rows (evidence, community).
export function TrustMark({
  name,
  emoji,
  style,
  size = 32,
}: {
  name: "money" | "evidence" | "community";
  emoji: string;
  style: IconStyle;
  size?: number;
}) {
  const tint = TRUST_TINT[name];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full leading-none text-crumb-ink"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.52),
        background: style === "emoji" ? `color-mix(in srgb, ${tint} 28%, white)` : tint,
      }}
      aria-hidden="true"
    >
      {style === "emoji" ? emoji : <TrustIcon name={name} size={Math.round(size * 0.5)} />}
    </span>
  );
}

// ---- Flowing gradient text ("signal ink") -----------------------------------
// Two neighbouring hues per kind, so the gradient moves between them (like
// Gemini's wordmark). Bright pairs for the dark caption sheet; deeper pairs for
// light surfaces (thread page) so the words stay readable.
export const INK_DARK: Record<SignalKind, [string, string]> = {
  health_claim: ["#C9A2FF", "#8DB4FF"], // lavender to periwinkle
  affiliate_link: ["#6CC0FF", "#B49CFF"], // sky to violet
  discount_code: ["#FF9A76", "#FFC978"], // coral to apricot
  paid_partnership: ["#FFC44D", "#FF8C66"], // gold to coral
  product_mention: ["#45EFB0", "#C6F86A"], // mint to lime
};
export const INK_LIGHT: Record<SignalKind, [string, string]> = {
  health_claim: ["#7A45D6", "#3D63D9"], // violet to blue
  affiliate_link: ["#1F6FD1", "#6A4BD6"], // blue to violet
  discount_code: ["#D9481F", "#C47A00"], // vermilion to amber
  paid_partnership: ["#B86A00", "#D23F2A"], // amber to vermilion
  product_mention: ["#0B8A5C", "#4C8A00"], // green to olive
};

export function inkStyle(kind: SignalKind, surface: "dark" | "light"): React.CSSProperties {
  const [a, b] = (surface === "dark" ? INK_DARK : INK_LIGHT)[kind];
  return { ["--ink" as string]: a, ["--ink2" as string]: b };
}
