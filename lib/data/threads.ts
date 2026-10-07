import type { Thread } from "@/lib/types";

export const threads: Thread[] = [
  {
    id: "t1",
    reelId: "r1",
    productName: "Kinetiq T-Check home kit",
    trust: {
      money: "detected",
      evidence: "not_supported",
      community: { reviews: 14, positive: 5, friends: 3 },
    },
    friendNames: ["Jess", "Tom", "Priya"],
    reviews: [
      {
        id: "rv1",
        author: "Tom",
        isFriend: true,
        bought: "yes",
        text: "Did this. Results were normal and my GP said the test wasn't needed. Turned out I just wasn't sleeping.",
        helpful: 23,
        postedAgo: "2w",
      },
      {
        id: "rv2",
        author: "Jess",
        isFriend: true,
        bought: "no",
        text: "Asked my GP first. Bloods were bulk-billed and covered more than this kit does.",
        helpful: 17,
        postedAgo: "5d",
      },
    ],
    sources: [
      {
        title: "Testosterone testing in men",
        publisher: "healthdirect",
        summary:
          "Tiredness has many causes, and low testosterone is only one of them. A doctor can decide whether a test is useful for you.",
        url: "https://www.healthdirect.gov.au",
      },
    ],
  },
  {
    id: "t2",
    reelId: "r2",
    productName: "Floralign Gut Reset",
    trust: {
      money: "disclosed",
      evidence: "mixed",
      community: { reviews: 31, positive: 17, friends: 1 },
    },
    friendNames: ["Ana"],
    reviews: [],
    sources: [],
  },
];

export function getThread(id: string | null): Thread | undefined {
  if (!id) return undefined;
  return threads.find((t) => t.id === id);
}
