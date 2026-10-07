# CLAUDE.md: Breadcrumb + Crumb prototype

Read this whole file before doing anything. It is the only context you have about this project.

## Who you're working with

- A designer (motion and visual background) who is new to coding. Explain what you're doing in plain language, one step at a time.
- Works on Windows with PowerShell. Give one command per line. Do not chain commands with `&&`.
- Always propose a plan and wait for approval before building anything substantial.
- After each working step, suggest a clear commit message and ask before committing.

## What this project is

A university design project (USyd Master of Design, Major Project) for Sydney Health Literacy Lab and Wiser Healthcare. The client brief: design a consumer tool that makes the **financial conflicts of interest** behind health content on social media more visible, understandable and actionable.

Core insight from our research: people trust their peers and friends more than influencers. So the product is crowd-sourced.

The product has two parts:

- **Breadcrumb**: a moderated, crowd-sourced platform. Every piece of social content (a reel, a post) gets a thread. People review it, link sources, and see what their friends said. Each thread shows trust signals.
- **Crumb**: a small overlay that sits on top of social media (we focus on Instagram Reels). It flags commercial and health-claim signals on the reel in real time, shows a short peek card, and links to the Breadcrumb thread.

**Goal:** nudge people toward better-informed decisions about health purchases. Inform, never decide for them. The tool never gives medical advice and never declares content true or false.

## What this prototype is (and isn't)

This is a **Wizard of Oz prototype** for user testing. It must feel real, but the intelligence is scripted.

- We cannot overlay the real Instagram app from the web. So we build a **mock Reels feed** and layer Crumb on top of it.
- Detection is **not live**. Each reel has a data file with signals and timestamps. Signals were generated ahead of time by an LLM pass over the reel's transcript (see Appendix). The prototype plays them back in sync with the video.
- Reels are our own recorded or stock clips with **fictional creators**. Never use real creators' names, handles or content. Do not copy Instagram's logo or branding; build a generic reels UI.

Out of scope: real Instagram integration, real-time detection, login/auth, a real backend or database.

## Persona

**Marcus, 38**, mid-career tradesperson in Sydney. On YouTube, Facebook and increasingly TikTok/Instagram, about an hour a day, mostly algorithmic feed. Moderate health literacy: comfortable with apps, doesn't cross-check health claims. Feels tired and less capable lately; content framing this as "low testosterone" resonates with him. He has no habit of checking whether a creator profits from what they promote.

## Core flow (the scenario we test)

1. Marcus has Crumb enabled. A thin handle sits on the screen edge.
2. He scrolls the reels feed. A creator pitches a home hormone test kit with a discount code.
3. Crumb notices signals. The handle glows; a small chip appears (e.g. "Discount code · 2 claims").
4. He taps the chip. A peek card slides up: three trust signals plus "3 people you know reviewed this".
5. He taps "See the thread" and lands on that reel's Breadcrumb thread.
6. He reads the signals, a friend's review, a plain-language source summary, and the "Talk to a professional" option.
7. He goes back to the reel, or leaves a review.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Motion (`motion/react`) for gestures and transitions
- Deployed on Vercel from GitHub (pushes update the link automatically)
- Mobile-first. Design for 390 × 844. On desktop, centre the app in a phone-sized frame.

## Folder structure

```
app/
  reels/page.tsx            mock feed + Crumb overlay
  thread/[id]/page.tsx      Breadcrumb thread
  onboarding/page.tsx       built last
lib/
  types.ts                  all data types
  data/reels.ts             reel data (signals, timestamps)
  data/threads.ts           thread data (reviews, sources)
  crumb-machine.ts          Crumb state logic
  playback.ts               syncs signals to video time
components/
  reels/                    feed, reel player
  crumb/                    handle, chip, peek card
  thread/                   signal breakdown, reviews, sources
public/reels/               reel video files (.mp4) and posters
```

Keep all logic in `lib/`. Components only render. When the UI is rebuilt from Figma later, `lib/` must not change.

## Data model

```ts
type SignalKind =
  | "discount_code"
  | "affiliate_link"      // "link in bio", tracked links
  | "paid_partnership"    // platform label or #ad
  | "health_claim"        // e.g. "fixes your fatigue"
  | "product_mention";

interface Signal {
  id: string;
  kind: SignalKind;
  label: string;          // short chip text, e.g. "Discount code"
  detail: string;         // one line for the peek card
  quote?: string;         // the words spoken or shown
  appearsAt: number;      // seconds into the reel
}

interface TrustSignals {
  money: "disclosed" | "detected" | "none_found";
  evidence: "supported" | "mixed" | "not_supported" | "unknown";
  community: { reviews: number; positive: number; friends: number };
}

interface Reel {
  id: string;
  creator: { handle: string; name: string; avatar: string };
  src: string;            // /reels/xxx.mp4
  poster: string;
  caption: string;
  durationSec: number;
  signals: Signal[];
  threadId: string | null; // null = no thread yet
}

interface Review {
  id: string;
  author: string;
  isFriend: boolean;
  bought: "yes" | "no" | "considering";
  text: string;
  helpful: number;
  postedAgo: string;
}

interface Source {
  title: string;
  publisher: string;
  summary: string;        // plain language, max 2 sentences
  url: string;
}

interface Thread {
  id: string;
  reelId: string;
  productName: string;
  trust: TrustSignals;
  reviews: Review[];
  sources: Source[];
}
```

Trust is shown as **three separate signals** (money, evidence, community), never collapsed into one score. A single number implies certainty, which the brief warns against.

## Seed content (fictional)

Create 3 reels so we can test detection and false alarms:

1. **Hormone test kit** (`@peakmode.dan`): "Always tired? I was, until I tested my testosterone. Link in bio, code DAN15." Signals: health_claim, affiliate_link, discount_code. Thread exists with 2 friend reviews and 1 source. Money: detected. Evidence: not_supported.
2. **Gut health supplement** (`@wellwithmia`): paid partnership label shown, claims about "resetting your gut". Signals: paid_partnership, health_claim. Thread exists. Money: disclosed. Evidence: mixed.
3. **Control reel** (`@coachsam.fit`): general advice to see a GP before buying tests, no product. Signals: none. Thread: null. Crumb should stay quiet here. This tests that we don't over-flag.

Use placeholder videos until real clips are added. Timestamps must match the moment each phrase is said.

## Crumb behaviour

State machine in `lib/crumb-machine.ts`:

| State | What the user sees | Moves to |
|---|---|---|
| `off` | Nothing | `dormant` when enabled |
| `dormant` | Thin handle on the right edge | `scanning` on a new reel (always-on) or on swipe (on-demand) |
| `scanning` | Subtle shimmer on the handle | `signals` when the first signal's time is reached; back to `dormant` if none |
| `signals` | Handle glows, chip appears | `peek` on chip tap; `dormant` on next reel |
| `peek` | Peek card slides up | `signals` on dismiss; navigates to thread on "See the thread" |

Rules:
- Chips never cover the creator's face, captions, or the like/comment/share buttons. Place them in the lower-left area above the caption, or attached to the handle.
- Show at most 2 chips at once. Extra signals are summarised ("+1 more").
- The peek card shows: three signal icons with one line each, the friends count, "See the thread" button. Nothing else.
- If a reel has no thread, "See the thread" becomes "Start a thread" and opens a new-thread state prefilled with the detected signals.
- Swiping to the next reel resets Crumb to `dormant`.

## Tone and wording

- Neutral and factual. Never use "scam", "fake", "false", "dangerous" or "lie".
- Describe what was found, not what it means: "Discount code detected", "Paid partnership", "2 health claims to check".
- Hedge detection honestly: "signals found", not "this is sponsored" when not disclosed.
- No medical advice. The help option is "Talk to a professional" linking to healthdirect (https://www.healthdirect.gov.au).
- Sentence case everywhere. Plain verbs. Buttons say exactly what happens.

## Visual design rules

- **Do not invent the visual design.** Until Figma frames are provided, build in plain grey-box styling: neutral greys, system font, no decoration. The point is to get the flow working.
- When a Figma frame link is provided, match it exactly: type, colour, spacing, radius. Use the Figma MCP to read it.
- Avoid generic AI-UI defaults: identical rounded cards everywhere, soft grey shadows on everything, gradient washes, all-caps eyebrow labels, emoji as icons.
- The reels feed should feel like a familiar short-video app so testers focus on Crumb, not the feed.

## Motion rules

- Motion explains what changed. No decorative motion.
- Crumb handle: draggable from the edge with `motion` drag, springs back if released early, snaps open past a threshold.
- Chip entrance: short and calm (about 200 to 300 ms). It should be noticeable, not alarming.
- Peek card: slides up from the bottom, dismiss by swipe down or tap outside.
- Respect `prefers-reduced-motion`: replace movement with simple fades.

## Video playback

- Use `<video muted playsInline loop autoPlay>`. Show a tap-to-unmute control.
- Vertical swipe between reels with snap scrolling. Only the visible reel plays.
- `lib/playback.ts` reads `currentTime` and tells Crumb which signals are due.

## Dev panel (for user testing)

Opens with **Shift + D** on desktop, or when the URL ends in `?dev=1` (needed on phones).

Controls:
- Chip style: `subtle` | `visible` (our main A/B test)
- Activation mode: `always-on` | `swipe-to-scan`
- Jump to reel 1, 2, 3
- Jump to time within the current reel
- Reset Crumb and reset onboarding
- Show a timeline of upcoming signals

Settings persist in `localStorage` so a test session survives a refresh. Wrap all storage access in try/catch.

## Make it feel like an app

- Add home-screen meta tags (apple-mobile-web-app-capable, theme colour, icons) so it opens full screen when saved to a phone.
- Turn off the Next.js dev indicator (`devIndicators: false`) for recordings.

## Build order

Do these in order. Stop after each one, show me what to check in the browser, and wait.

1. Types, seed data, `crumb-machine.ts`, `playback.ts`. No UI. Commit and tag `logic-v1`.
2. Mock reels feed: vertical swipe, autoplay, mute toggle.
3. Crumb handle and swipe gesture.
4. Chips and peek card, synced to video time.
5. Thread page (grey-box first; rebuilt later from Figma).
6. Deep link from peek card to thread, and back to the same reel and time.
7. "Start a thread" state for reels with no thread.
8. Add-a-review flow (saved to `localStorage` so testers see their review).
9. Dev panel.
10. Onboarding: enable Crumb, learn the swipe on a demo reel, tour a sample thread.

When rebuilding UI from Figma: "Keep everything in `lib/` untouched."

---

## Appendix: signal extraction prompt

Use this offline to turn each reel's transcript into signal data. Paste the transcript (with word timestamps) and caption into Claude with this prompt, then copy the JSON into `lib/data/reels.ts`.

```
You are analysing a short health-related social media video for a research prototype.

Input:
- CAPTION: <caption text>
- TRANSCRIPT: <transcript with timestamps in seconds>

Find every commercial or health-claim signal. Kinds:
- discount_code: a promo or discount code
- affiliate_link: "link in bio", "link below", tracked links
- paid_partnership: #ad, #sponsored, "paid partnership", "partnered with"
- health_claim: a statement that the product treats, fixes, improves or prevents a health issue
- product_mention: a named product or brand being promoted

Rules:
- Only report what is actually said or shown. Do not guess hidden motives.
- Use neutral wording. Never call anything false, a scam or dangerous.
- "label" is 1 to 3 words for a chip. "detail" is one plain sentence under 15 words.
- "appearsAt" is the second the signal is first said or shown.
- If there are no signals, return an empty array.

Return only valid JSON, no other text:
[
  {
    "id": "s1",
    "kind": "discount_code",
    "label": "Discount code",
    "detail": "The creator shares a code that likely earns them commission.",
    "quote": "use code DAN15",
    "appearsAt": 6.2
  }
]
```
