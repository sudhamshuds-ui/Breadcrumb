// Reviews the tester writes are kept on their phone (localStorage), so they
// show up straight away and survive a refresh. Nothing is sent anywhere.

import type { Relation, Review } from "@/lib/types";
import { readStore, writeStore } from "@/lib/storage";

const key = (threadId: string) => `breadcrumb.reviews.${threadId}`;

export function readMyReviews(threadId: string): Review[] {
  return readStore<Review[]>(key(threadId), []);
}

export function addMyReview(
  threadId: string,
  input: Pick<Review, "bought" | "verdict" | "text">,
): Review[] {
  const review: Review = {
    id: `mine-${Date.now()}`,
    author: "You",
    isFriend: false,
    bought: input.bought,
    verdict: input.verdict,
    text: input.text.trim(),
    helpful: 0,
    postedAgo: "Just now",
    mine: true,
  };
  const next = [review, ...readMyReviews(threadId)];
  writeStore(key(threadId), next);
  return next;
}

export function relationOf(r: Review): Relation {
  return r.relation ?? (r.isFriend ? "friend" : "peer");
}

// People you know first: friends, then contacts, then everyone else.
// Within each group, the most helpful first. Your own reviews lead.
const ORDER: Record<Relation, number> = { friend: 0, contact: 1, peer: 2 };

export function sortReviews(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => {
    if (a.mine !== b.mine) return a.mine ? -1 : 1;
    const g = ORDER[relationOf(a)] - ORDER[relationOf(b)];
    return g !== 0 ? g : b.helpful - a.helpful;
  });
}
