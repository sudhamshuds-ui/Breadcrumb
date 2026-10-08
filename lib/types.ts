// All data types for the Breadcrumb + Crumb prototype.
// Components render these; nothing here knows about the UI.

export type SignalKind =
  | "discount_code"
  | "affiliate_link" // "link in bio", tracked links
  | "paid_partnership" // platform label or #ad
  | "health_claim" // e.g. "fixes your fatigue"
  | "product_mention";

export interface Signal {
  id: string;
  kind: SignalKind;
  label: string; // short chip text, e.g. "Discount code"
  detail: string; // one line for the peek card
  quote?: string; // the words spoken or shown
  captionQuote?: string; // the matching words in the written caption, if any
  appearsAt: number; // seconds into the reel
}

export interface TrustSignals {
  money: "disclosed" | "detected" | "none_found";
  evidence: "supported" | "mixed" | "not_supported" | "unknown";
  community: { reviews: number; positive: number; friends: number };
}

// One line of the reel's spoken audio, used for auto-captions.
export interface TranscriptLine {
  start: number;
  end: number;
  text: string;
}

// How strongly Crumb reacts to a reel:
// - "flag": money or health signals worth a close look (full glow + chip)
// - "facts": health-adjacent, worth knowing but not alarming (calm chip, no glow)
// - "quiet": nothing to show; Crumb stays silent
export type ReelTier = "flag" | "facts" | "quiet";

export interface ReelTheme {
  from: string;
  to: string;
  accent: string;
}

export interface Comment {
  author: string;
  text: string;
  likes: number;
  ago: string;
  byCreator?: boolean;
}

export interface Reel {
  id: string;
  creator: { handle: string; name: string; initials: string; ring: [string, string]; avatar: string };
  src: string; // /reels/xxx.mp4
  poster: string; // first frame, shown while the video loads
  tier: ReelTier;
  caption: string;
  postedOn: string;
  audio: string;
  paidPartner: string | null; // platform "Paid partnership with ..." label
  durationSec: number;
  stats: { likes: string; comments: string; reposts: string; shares: string };
  theme: ReelTheme; // colours behind the video while it loads, and the avatar
  transcript: TranscriptLine[]; // spoken audio, from the transcript files
  comments: Comment[];
  signals: Signal[];
  // Just for fun, not a flag: a one-off chip (no badge, no peek card entry).
  aside?: { emoji: string; label?: string; at: number; holdMs?: number };
  threadId: string | null; // null = no thread yet
}

// How a reviewer relates to you: people you know are shown first.
export type Relation = "friend" | "contact" | "peer";

export interface Review {
  id: string;
  author: string;
  isFriend: boolean;
  relation?: Relation; // defaults to "friend" when isFriend, else "peer"
  bought: "yes" | "no" | "considering";
  verdict?: "worth_it" | "not_worth_it" | "unsure";
  text: string;
  helpful: number;
  postedAgo: string;
  mine?: boolean; // written by the tester on this device
}

export type SourceType =
  | "Clinical trial"
  | "Systematic review"
  | "Review"
  | "Position stand"
  | "Lab study"
  | "Health service"
  | "Regulator"
  | "Patient organisation";

export interface Source {
  title: string;
  publisher: string;
  type: SourceType;
  year?: string;
  summary: string; // plain language, max 2 sentences
  url: string;
}

// A creator's history across Breadcrumb. Scored per post, never as one number.
export interface CreatorRecord {
  postsReviewed: number;
  postsFlagged: number;
  disclosed?: [number, number]; // [disclosed, sponsored posts found]
  note: string;
}

export interface DiscussionPost {
  id: string;
  author: string;
  role?: string; // verified professional, e.g. "Pharmacist"
  isFriend?: boolean;
  text: string;
  votes: number;
  postedAgo: string;
  replies?: DiscussionPost[];
}

// Who to talk to about this topic (drives the "Talk to a professional" card).
export interface CareTopic {
  topic: string; // "weight management"
  first: string; // "A GP can check what suits you and refer you on"
  professionals: string[]; // call options, e.g. ["GP", "Dietitian"]
}

export interface Thread {
  id: string;
  reelId: string;
  productName: string;
  trust: TrustSignals;
  moneyNote?: string; // overrides the peek card's money line, e.g. a brand's own ad
  evidenceNote: string; // what the sources say, in two plain sentences
  friendNames: string[];
  creator: CreatorRecord;
  care: CareTopic;
  reviews: Review[];
  sources: Source[];
  discussion: DiscussionPost[];
  lastModerated: string; // "2 days ago"
}
