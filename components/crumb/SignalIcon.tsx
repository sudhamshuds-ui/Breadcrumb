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

const TRUST_ICONS: Record<"money" | "evidence" | "community", LucideIcon> = {
  money: CircleDollarSign,
  evidence: FlaskConical,
  community: Users,
};

export function SignalIcon({ kind, size = 13 }: { kind: SignalKind; size?: number }) {
  const Icon = KIND_ICONS[kind];
  return <Icon size={size} strokeWidth={2.2} aria-hidden="true" />;
}

export function TrustIcon({ name, size = 16 }: { name: keyof typeof TRUST_ICONS; size?: number }) {
  const Icon = TRUST_ICONS[name];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}
