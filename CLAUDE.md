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

## Current status (updated 2026-10-09)

Live: https://breadcrumb-mocha.vercel.app/reels (auto-deploys from `main` on GitHub `sudhamshuds-ui/Breadcrumb`, private repo, public link). Pushes update the same link; teammates never need a new one.

The user works on both a Windows PC (`D:\projects\Breadcrumb`) and a Mac (cloned from GitHub). Always `git pull` before starting and push when done. Claude's auto-memory does not sync between machines, so anything worth remembering belongs in this file.

### What's built

- **Real 5-reel feed** (`/reels`), replacing the scripted scenes and the "Seed content" section above. Order 1, 3, 2, 4, 5 so two flagged reels never sit back to back:
  | id | Clip | Tier | Crumb shows |
  |---|---|---|---|
  | r1 | Weight-loss telehealth (Felix) | flag | Paid partnership · weight-loss medication · price offer |
  | r3 | Diet Coke stand-up joke | quiet | Nothing at all |
  | r2 | Broc Shot supplement, psoriasis | flag | Paid partnership · endorsement claim · skin results claim |
  | r4 | 4-supplement stack + coaching DMs | facts | 2 claims stated · coaching offer |
  | r5 | Co-Biotics brand's own ad | facts | 1 claim stated · brand's own ad |
- **Tiers** live in `Reel.tier` (`flag` = red widget glow and badge; `facts` = amber, worded "stated"/"noticed"; `quiet` = no flags).
- **Real people policy:** the clips are real downloaded reels, but every creator name, handle, stat and comment is fictional (user's decision). Brand names appear only where the video says them. Creator avatars are face crops from their own video. Reel 2 shows a very famous celebrity; testers will recognise her.
- **Signal timing** was estimated from the transcripts (`public/reels/reel-0N.txt`) and spot-checked against burned-in captions for r1 and r4. r2 and r5 have no burned-in captions, so their chips may be a second or two off.
- **Auto-advance**: when a reel ends, the feed glides to the next one (only the last reel loops). If a sheet or the peek card is open, the reel replays instead.
- **Resume**: `/reels?reel=X&t=Y` (back from a thread) resumes at that moment; signals already said count as found quietly (`CATCH_UP`), so nothing old is re-announced. The rewind-on-swipe only fires when the reel actually changes (React re-runs effects in development).
- **Video playback** (`components/reels/ReelVideo.tsx`, `lib/use-reel-clock.ts`): every reel stays mounted; only the visible one plays. Crumb reads the video's own `currentTime`. Reels start muted (iPhones always allow that); the first tap anywhere turns sound on instead of pausing. Each reel has a first-frame poster (`reel-0N.jpg`) and neighbours are warmed up (muted play then pause) so swiping never flashes black.
- **Caption sheet**: flagged phrases are gradient-filled text (two hues per signal kind, flows 3 times then rests, selected phrase keeps flowing) with a soft drop-shadow glow. Brighter than the chip pastels on purpose, for contrast on the dark sheet.
- **Share sheet** (`ShareSheet.tsx`): Instagram-style; tick fictional friends then Send ("Sent to Tom"), Copy link, Share to… (the phone's real share menu), Add to story (pretend).
- **Profile pictures** (`lib/avatars.ts`): the user's sketch is "you" (`public/avatars/me.jpg`); every friend, commenter, reviewer and discussion author has their own fixed stock portrait (`stock-01..32.jpg`, randomuser.me), assigned by name in `ASSIGNED`. Add new people there so nobody shares a face.
- **Crumb widget overhaul (2026-10-09)** (`components/crumb/CrumbWidget.tsx`, `lib/crumb-machine.ts`). Workplace testing showed people had to watch 3-4 things at once (handle glow, screen-edge glow, chips, the reel), so **one widget now does everything**. The right-edge handle, its menu, the separate chip, the screen-edge glow and the pause state are gone.
  - Placement: a 46 px light circle (#EDEDED) with the new bread logo, lower-left above the creator row (`WIDGET_BOTTOM` in `ReelsApp.tsx`).
  - Glow anatomy (matching the user's reference): a crisp, slightly larger disc offset up-left forms a crescent rim (~2.5 px on the lit side, blur 0.35 px, "Ellipse 11"), backed by a dimmer soft halo; not a plain radial blur.
  - Scanning: the Figma "Widget glowing - detecting" glow, made alive: three blurred light layers (mint #42FA9C, cyan #00BAFF, blue #1845D9, highlight #B1FFD7) circle the rim at different speeds and directions; a ring pulse is born at the rim, scales out and fades. Kept tight to the rim (the user found a wider spread too much). On a reel with nothing found, the glow fades out slowly (~1.6 s) when scanning ends.
  - A flag: the circle stretches into a chip with the flag's emoji/icon and label (no logo, no glow while it's a chip), holds `ANNOUNCE_MS` (3 s), then folds back with a count badge and the tier glow. Several flags queue: each chip, then a `REST_MS` (2 s) breather as the plain widget, then the next; not tied to the exact second in the reel. On landing on a reel (or opening the app), Crumb first scans for `LOOK_MS` (4 s) before its first chip, even if a flag is due at 0:01, so it's seen listening instead of flagging instantly. The badge counts only flags already shown. Hard flags are red (glow #F04A4A family, badge #F64444); `facts` reels are amber (glow #FFB21E family, badge #F5A623).
  - Tap: the circle morphs into the peek card (shared layoutId). Peek card: "Crumb found / Crumb noticed" + count + close (×), each flag with mark, label, one line and timestamp, evidence as one more row ("No supporting evidence linked" / "Evidence is mixed"…), friends' faces + "N reviews · N positive", "See the thread". No creator header (already on the reel), no friend quote, no glass border. Nothing flagged: a small "Nothing flagged yet" card ("Crumb hasn't found money or health-claim signals in this reel so far."), never "all good".
  - Press and hold (650 ms, a ring fills): Crumb turns off and slides out left; a toast says how to bring it back. A plain wrapper handles the hold, because Motion swallows raw pointer events on its animated elements.
  - Off: a slim light tab at the left edge (not the very edge, which is iPhone's back gesture). Swipe it right or tap it to turn Crumb on. Coming back always shows the plain widget, never a chip: signals already said count as found, quietly (`TURN_ON` carries `alreadySaid`), it starts with the 2 s breather so a flag due that instant waits its turn, and a passed `aside` counts as shown. All three ways back (tab, toast, island) go through `turnOn()` in `ReelsApp.tsx`.
  - Just for fun: reel r3 has an `aside` chip, "😂 Just a joke", after the punchline. Not a flag: no badge, no peek card entry.
  - Icons A/B (`lib/icon-style.ts`): flag marks as iOS emoji (default) or line icons; switch with `?icons=line` / `?icons=emoji`, remembered on the device.
  - Review board at `/states` shows the live widget in every state.
  - Caption sheet: the widget is hidden while the sheet is up, so a mini widget (`CrumbMini`: same circle, logo, tier rim and count badge) sits under the creator row with "Crumb found N things in this reel. See what"; tap opens the peek card. It replaced the old peach money pill.
  - The joke reel's aside is emoji only, "😂😂", and lingers 4.4 s.
- **New logo** (Figma "Logo"): `CrumbGlyph` is now the bread with quote-mark eyes (`body` and `face` colours configurable); source SVGs in `public/brand/`. App icons: `app/icon.svg` (favicon) and `app/apple-icon.png` (home screen, 180 px).
- **Phone shell**: floating see-through nav pill (no blur, it made swiping stutter), creator row and progress line spaced like Instagram, 9:41 fake status bar in the desktop frame only.
- **Breadcrumb thread pages** (`/thread/t1`, `t2`, `t4`, `t5`; `components/thread/ThreadView.tsx`), distilled for a ~30-second visit (impeccable shape + distill):
  - Overhauled with the widget (2026-10-09): page on the widget's light #EDEDED with white cards, new logo, emoji/line marks. First screen: compact post strip, then **the peek card at full size** ("Crumb found" / "Crumb noticed", red or amber count, the money line, every flag with its timestamp linking back to that moment, evidence as one more row, friends' faces with review counts), then the dark "Talk to a professional about {topic}" card. The card and the page share `components/crumb/Findings.tsx`, so they always match. On the thread page each flag row also shows the exact words from the reel in flowing "signal ink" (deeper `INK_LIGHT` pairs, no glow); the caption sheet uses the bright `INK_DARK` pairs. Both live in `SignalIcon.tsx`.
  - "People you know" reviews (friends first, your own review on top marked "Waiting for moderation"), "See all N reviews" for contacts and everyone else.
  - "What the evidence says": every source visible with type, publisher, year and a one-line takeaway; tap to open the full summary and link.
  - "More on this thread" folds: about the creator (posts reviewed, with signals, ads disclosed) and discussion (verified professionals marked, upvotes, replies). Signal moments now live in the top card.
  - One help CTA at a time: the bottom bar ("Talk to a professional" + review) slides in only while the care card is out of view.
  - Mock care flow (`CareSheet.tsx`, `lib/data/care.ts`): fictional inner-west Sydney clinics, then time slots, then "You're booked in" (marked prototype only); schedule a call with a GP / pharmacist / dietitian; the real healthdirect line `tel:1800022222`.
  - Write a review (`ReviewSheet.tsx`, `lib/my-reviews.ts`): bought it? worth it? text; saved in localStorage per thread.
  - Every source in `lib/data/threads.ts` was verified on 2026-10-09 (links open; PubMed IDs match). Never add an unverified citation.
  - `/thread/new` (and reel r3, which has no thread) still shows the "start a thread" placeholder.
- **Swipe-back fix**: opening a thread saves the reel and time into the reels page's own history entry and sets `breadcrumb.threadFromReels` in sessionStorage. The thread's back button uses `router.back()`, and the reels page then pushes a fresh entry to wipe the "forward" thread page, so an iPhone edge swipe (e.g. pulling the Crumb handle) can't reopen it.

### Decisions made

- **PRODUCT.md** holds the product truth for design work (users, success order, binding constraints, principles). `.impeccable/config.json` sets the Impeccable build path to code-first.

- **Visual design** follows `DESIGN.md` (Cursor tokens: cream `#f7f7f4`, warm ink, hairlines, no shadows) plus the Figma coral glow; this replaces the "grey-box only" rule above. Button orange `#d04200` and muted text `#6e6b62` for WCAG AA. Font: Geist. Sentence case.
- **Signal kinds use one pastel each** in chips: claim lavender, link blue, code peach, partnership gold, mention mint.
- **Corners**: controls are full pills; cards 28 outer / 22 core; nested panels 16.
- **Wording**: neutral and hedged ("no disclosure seen", "Linked sources don't support them yet").
- **Motion**: no endless decorative loops (the caption gradient flows 3 times, then rests).
- **Videos must be H.264 MP4 at original quality.** A VP9 export played in desktop Chrome but was blank on iPhone, and heavy compression (RF 28) looked too poor. Before pushing any new video, check for `avc1` (not `vp09`/`hev1`) and the moov box before mdat. Every reel needs a poster still.
- **Tailwind via `@tailwindcss/postcss`**: the Turbopack loader didn't hot-reload CSS.
- **Testing in Claude's browser pane**: ask the user to open the pane before visual checks. A hidden pane stops the dev build from loading, freezes animations and crops screenshots. Fallback: the `prod` launch config (`next start` on port 3001) loads even when hidden.

### Open issues

- **Home-screen mode on iPhone**: iOS opens the app in a window short by the status bar height (black strip under the nav) until the page is pulled down once. An automatic retry nudge is in `PhoneFrame.tsx` but doesn't fix it. Workaround for testing: open in Safari, or pull down once per session.
- **Wrong URLs show a 404** (`/Reels`, `/reel`). A forgiving redirect to `/reels` has been offered but not built.
- **Home-screen icon** is generic.
- **The user is redesigning the widget** (states, glow, peek card, interaction) and will share it next. Keep everything in `lib/` stable.
- **Not built yet**: dev panel (chip style A/B, swipe-to-scan mode), start-a-thread, onboarding.
- **Next design pass**: `/impeccable polish` on the thread page after the user has seen it on their iPhone.

### Next step

Wait for the widget redesign from the user, then rebuild the Crumb components to match it, keeping `lib/` untouched.

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
