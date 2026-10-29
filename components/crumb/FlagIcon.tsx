import {
  ChatCircleText,
  Flask,
  Handshake,
  LinkSimple,
  Package,
  Pill,
  Tag,
  type Icon,
} from "@phosphor-icons/react";
import type { FlagIconName, SignalKind } from "@/lib/types";
import { INK_LIGHT } from "./SignalIcon";

// Flag marks drawn with Phosphor (duotone), replacing the emoji. Each kind has
// a default icon and its own colour (the deeper signal-ink hue, so it matches
// the flowing text beside it). A phrase can name a more specific icon, e.g. a
// pill for a product that is a medicine.

const BY_KIND: Record<SignalKind, Icon> = {
  paid_partnership: Handshake,
  product_mention: Package,
  discount_code: Tag,
  health_claim: ChatCircleText,
  affiliate_link: LinkSimple,
};

const BY_NAME: Record<FlagIconName, Icon> = {
  pill: Pill,
};

type Mark = SignalKind | "evidence";

export function FlagIcon({ mark, icon, size = 20 }: { mark: Mark; icon?: FlagIconName; size?: number }) {
  const Glyph = icon ? BY_NAME[icon] : mark === "evidence" ? Flask : BY_KIND[mark];
  const color = INK_LIGHT[mark === "evidence" ? "health_claim" : mark][0];
  return <Glyph size={size} weight="duotone" color={color} aria-hidden="true" />;
}
