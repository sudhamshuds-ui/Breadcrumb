// Replies the tester writes under a review or a professional's answer. Kept
// on their phone (localStorage), like their reviews; nothing is sent anywhere.

import type { DiscussionPost } from "@/lib/types";
import { readStore, writeStore } from "@/lib/storage";

type RepliesByParent = Record<string, DiscussionPost[]>;

const key = (threadId: string) => `breadcrumb.replies.${threadId}`;

export function readMyReplies(threadId: string, parentId: string): DiscussionPost[] {
  return readStore<RepliesByParent>(key(threadId), {})[parentId] ?? [];
}

export function addMyReply(threadId: string, parentId: string, text: string): DiscussionPost[] {
  const all = readStore<RepliesByParent>(key(threadId), {});
  const reply: DiscussionPost = {
    id: `mine-${Date.now()}`,
    author: "You",
    text: text.trim(),
    votes: 0,
    postedAgo: "Just now",
    mine: true,
  };
  const next = [...(all[parentId] ?? []), reply];
  writeStore(key(threadId), { ...all, [parentId]: next });
  return next;
}
