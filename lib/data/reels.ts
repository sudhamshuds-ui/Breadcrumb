import type { Reel } from "@/lib/types";

// Fictional creators and products only. Signal times match the moment
// each phrase is spoken in the transcript below.

export const reels: Reel[] = [
  {
    id: "r1",
    creator: {
      handle: "peakmode.dan",
      name: "Dan Reyes",
      initials: "DR",
      ring: ["#F58529", "#DD2A7B"],
    },
    src: null,
    poster: null,
    caption:
      "Always tired? I was, until I tested my testosterone 🧪 Link in bio, use code DAN15 for 15% off the Kinetiq home kit. #energy #menshealth #testosterone",
    postedOn: "29 September",
    audio: "peakmode.dan · Original audio",
    paidPartner: null,
    durationSec: 16,
    stats: { likes: "37.3K", comments: "191", reposts: "755", shares: "15.9K" },
    theme: { from: "#141B26", to: "#5A311B", accent: "#E2653A" },
    product: {
      brand: "KINETIQ",
      name: "T-Check",
      line: "At-home testosterone test",
      shape: "box",
    },
    transcript: [
      { start: 0, end: 2.0, text: "Always tired? Foggy by 2pm?" },
      { start: 2.0, end: 3.4, text: "I was. Every single day." },
      { start: 3.4, end: 6.2, text: "This test is how I got my energy back." },
      { start: 6.2, end: 7.6, text: "Five minutes, results in a week." },
      { start: 7.6, end: 10.6, text: "Low T is behind most men's fatigue." },
      { start: 10.6, end: 12.4, text: "Link in bio," },
      { start: 12.4, end: 14.8, text: "use code DAN15 for 15% off." },
      { start: 14.8, end: 16, text: "Thank me later." },
    ],
    beats: [
      { start: 0, end: 3.4, kind: "hook", title: "Always tired?", subtitle: "every. single. day." },
      { start: 3.4, end: 7.6, kind: "product" },
      { start: 7.6, end: 10.6, kind: "detail", title: "Low T?", subtitle: "results in 7 days" },
      { start: 10.6, end: 16, kind: "code", title: "DAN15", subtitle: "15% off · link in bio" },
    ],
    comments: [
      { author: "gymrat_josh", text: "Ordered mine yesterday 🙌", likes: 2312, ago: "1w" },
      { author: "peakmode.dan", text: "@lena.k code still works til Sunday 🔥", likes: 10, ago: "2d", byCreator: true },
    ],
    signals: [
      {
        id: "r1-s1",
        kind: "health_claim",
        label: "Health claim",
        detail: "Says the test kit is how the creator got their energy back.",
        quote: "This test is how I got my energy back",
        captionQuote: "I was, until I tested my testosterone",
        appearsAt: 3.6,
      },
      {
        id: "r1-s2",
        kind: "health_claim",
        label: "Health claim",
        detail: "A general claim about what causes tiredness in men.",
        quote: "Low T is behind most men's fatigue",
        appearsAt: 7.8,
      },
      {
        id: "r1-s3",
        kind: "affiliate_link",
        label: "Link in bio",
        detail: "Points to a link that may be tracked for sales.",
        quote: "Link in bio",
        captionQuote: "Link in bio",
        appearsAt: 10.8,
      },
      {
        id: "r1-s4",
        kind: "discount_code",
        label: "Discount code",
        detail: "Codes like this often earn the creator a commission.",
        quote: "use code DAN15",
        captionQuote: "code DAN15",
        appearsAt: 12.6,
      },
    ],
    threadId: "t1",
  },
  {
    id: "r2",
    creator: {
      handle: "wellwithmia",
      name: "Mia Lane",
      initials: "ML",
      ring: ["#8BC34A", "#2E7D32"],
    },
    src: null,
    poster: null,
    caption:
      "7 days to reset my gut 🌿 Floralign has been part of my mornings all week. Full routine pinned below. #ad #guthealth #wellness",
    postedOn: "2 October",
    audio: "wellwithmia · Original audio",
    paidPartner: "Floralign",
    durationSec: 14,
    stats: { likes: "12.8K", comments: "402", reposts: "218", shares: "3.1K" },
    theme: { from: "#1F2A1D", to: "#8C9A6B", accent: "#C8D98A" },
    product: {
      brand: "FLORALIGN",
      name: "Gut Reset",
      line: "Daily prebiotic blend",
      shape: "jar",
    },
    transcript: [
      { start: 0, end: 2.2, text: "Okay, gut health check." },
      { start: 2.2, end: 4.2, text: "I've been on Floralign for a week." },
      { start: 4.2, end: 7.0, text: "It literally resets your gut in seven days." },
      { start: 7.0, end: 8.6, text: "One scoop in water, every morning." },
      { start: 8.6, end: 11.4, text: "No more bloating, no more brain fog." },
      { start: 11.4, end: 14, text: "Full routine pinned in comments." },
    ],
    beats: [
      { start: 0, end: 2.2, kind: "hook", title: "Gut check", subtitle: "day 7" },
      { start: 2.2, end: 8.6, kind: "product" },
      { start: 8.6, end: 14, kind: "detail", title: "No bloating?", subtitle: "my morning routine" },
    ],
    comments: [
      { author: "sarah.moves", text: "Does it taste okay?", likes: 88, ago: "3d" },
      { author: "wellwithmia", text: "@sarah.moves honestly like nothing!", likes: 12, ago: "3d", byCreator: true },
    ],
    signals: [
      {
        id: "r2-s1",
        kind: "paid_partnership",
        label: "Paid partnership",
        detail: "Labelled as a paid partnership with Floralign.",
        quote: "Paid partnership with Floralign",
        captionQuote: "#ad",
        appearsAt: 0.6,
      },
      {
        id: "r2-s2",
        kind: "health_claim",
        label: "Health claim",
        detail: "Says the supplement resets gut health in a week.",
        quote: "It literally resets your gut in seven days",
        captionQuote: "reset my gut",
        appearsAt: 4.4,
      },
      {
        id: "r2-s3",
        kind: "health_claim",
        label: "Health claim",
        detail: "Links the product to less bloating and brain fog.",
        quote: "No more bloating, no more brain fog",
        appearsAt: 8.8,
      },
    ],
    threadId: "t2",
  },
  {
    id: "r3",
    creator: {
      handle: "coachsam.fit",
      name: "Sam Okafor",
      initials: "SO",
      ring: ["#4FC3F7", "#3949AB"],
    },
    src: null,
    poster: null,
    caption:
      "Quick one before you buy any test online. Tired has a lot of causes, and your GP is a good first stop. #health #fitnesstips",
    postedOn: "4 October",
    audio: "coachsam.fit · Original audio",
    paidPartner: null,
    durationSec: 12,
    stats: { likes: "5,204", comments: "88", reposts: "61", shares: "940" },
    theme: { from: "#17222D", to: "#3E5466", accent: "#9CC9E8" },
    product: { brand: "", name: "", line: "", shape: "none" },
    transcript: [
      { start: 0, end: 2.4, text: "Seeing ads for home hormone tests?" },
      { start: 2.4, end: 5.2, text: "Feeling tired has a lot of possible causes." },
      { start: 5.2, end: 8.4, text: "Before buying anything, chat to your GP." },
      { start: 8.4, end: 12, text: "They can work out which tests make sense." },
    ],
    beats: [
      { start: 0, end: 2.4, kind: "hook", title: "Before you buy", subtitle: "a home hormone test" },
      { start: 2.4, end: 5.2, kind: "talk", title: "Tired?", subtitle: "sleep · stress · iron · thyroid · more" },
      { start: 5.2, end: 12, kind: "talk", title: "Start with your GP", subtitle: "then decide what to test" },
    ],
    comments: [
      { author: "marcus.builds", text: "Needed this, cheers", likes: 41, ago: "1d" },
    ],
    signals: [],
    threadId: null,
  },
];

export function getReel(id: string): Reel | undefined {
  return reels.find((r) => r.id === id);
}
