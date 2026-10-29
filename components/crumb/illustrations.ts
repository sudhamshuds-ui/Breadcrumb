import type { Signal, SignalKind } from "@/lib/types";

// Illustrations from the Figma "illustrations" set (node 1470-483), exported
// as 512 px squares into public/illustrations/. Each flag kind has a default;
// a signal can pick its own with `Signal.illustration` when two flags of the
// same kind need different pictures.

const BY_KIND: Partial<Record<SignalKind, string>> = {
  paid_partnership: "/illustrations/money.webp",
  product_mention: "/illustrations/pills.webp",
  discount_code: "/illustrations/discount.webp",
};

export const EVIDENCE_ILLUSTRATION = "/illustrations/microscope.webp";

export function illustrationFor(signal: Signal): string | undefined {
  return signal.illustration ?? BY_KIND[signal.kind];
}
