import type { Thread } from "@/lib/types";

// Fictional community threads. Reviews are written by us, not taken from the
// real comments; they talk about the topic, never about the brand's service.

export const threads: Thread[] = [
  {
    id: "t1",
    reelId: "r1",
    productName: "Felix weight-loss treatment plans",
    trust: {
      money: "disclosed",
      evidence: "mixed",
      community: { reviews: 9, positive: 4, friends: 2 },
    },
    friendNames: ["Priya", "Tom"],
    reviews: [
      {
        id: "rv1",
        author: "Priya",
        isFriend: true,
        bought: "considering",
        text: "Asked my GP about these medicines first. Worth knowing the ongoing cost and the side effects before signing up to anything.",
        helpful: 14,
        postedAgo: "1w",
      },
      {
        id: "rv2",
        author: "Tom",
        isFriend: true,
        bought: "no",
        text: "My sister tried an online program. The check-ins were short, so she kept seeing her own GP as well.",
        helpful: 9,
        postedAgo: "3w",
      },
    ],
    sources: [
      {
        title: "Medicines for weight loss",
        publisher: "healthdirect",
        summary:
          "Weight-loss medicines can help some people alongside changes to diet and activity. They can have side effects and need ongoing review by a doctor.",
        url: "https://www.healthdirect.gov.au",
      },
    ],
  },
  {
    id: "t2",
    reelId: "r2",
    productName: "Broc Shot sulforaphane supplement",
    trust: {
      money: "disclosed",
      evidence: "not_supported",
      community: { reviews: 21, positive: 6, friends: 3 },
    },
    friendNames: ["Jess", "Sam", "Ana"],
    reviews: [
      {
        id: "rv3",
        author: "Jess",
        isFriend: true,
        bought: "no",
        text: "My dermatologist said there isn't good evidence for supplements in psoriasis yet. I stuck with my prescribed cream.",
        helpful: 31,
        postedAgo: "4d",
      },
      {
        id: "rv4",
        author: "Sam",
        isFriend: true,
        bought: "yes",
        text: "Took it for a month. Didn't notice a change, but my flare-ups come and go anyway, so hard to tell.",
        helpful: 12,
        postedAgo: "2w",
      },
    ],
    sources: [
      {
        title: "Psoriasis",
        publisher: "healthdirect",
        summary:
          "Psoriasis is a long-term condition that often comes and goes. A GP or dermatologist can help you find a treatment that works for you.",
        url: "https://www.healthdirect.gov.au",
      },
    ],
  },
  {
    id: "t4",
    reelId: "r4",
    productName: "Daily supplement stack (creatine, magnesium, vitamin D, omega-3)",
    trust: {
      money: "detected",
      evidence: "mixed",
      community: { reviews: 12, positive: 7, friends: 1 },
    },
    moneyNote: "Offers 1-on-1 coaching in the caption",
    friendNames: ["Tom"],
    reviews: [
      {
        id: "rv5",
        author: "Tom",
        isFriend: true,
        bought: "yes",
        text: "Creatine is well studied. The vitamin D and testosterone bit, less so. My GP said it only matters if you're actually low.",
        helpful: 18,
        postedAgo: "6d",
      },
    ],
    sources: [
      {
        title: "Vitamin D",
        publisher: "healthdirect",
        summary:
          "Most people get enough vitamin D from sunlight and food. A doctor can check your levels before you take supplements.",
        url: "https://www.healthdirect.gov.au",
      },
    ],
  },
  {
    id: "t5",
    reelId: "r5",
    productName: "Co-Biotics daily supplements",
    trust: {
      money: "disclosed",
      evidence: "unknown",
      community: { reviews: 3, positive: 2, friends: 0 },
    },
    moneyNote: "Ad posted by the brand itself",
    friendNames: [],
    reviews: [],
    sources: [],
  },
];

export function getThread(id: string | null): Thread | undefined {
  if (!id) return undefined;
  return threads.find((t) => t.id === id);
}
