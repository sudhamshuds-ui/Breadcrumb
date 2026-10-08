# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary persona: Marcus, 38**, a mid-career tradesperson in Sydney. Spends about an hour a day on YouTube, Facebook and increasingly TikTok/Instagram, mostly the algorithmic feed. Moderate health literacy: comfortable with apps, doesn't cross-check health claims. Feels tired and less capable lately, so "low testosterone" style content lands with him. No habit of checking whether a creator profits from what they promote.
- **Real testers:** a mix of target users (everyday social media users with mixed health literacy, on their own phones) and design reviewers, tutors and the client (Sydney Health Literacy Lab and Wiser Healthcare).
- **Job:** while scrolling health content, notice when money or unsupported claims are behind a post, understand what that means, and get to a qualified person before buying.

## Product Purpose

A consumer tool that makes the **financial conflicts of interest** behind health content on social media more visible, understandable and actionable (client brief, USyd Master of Design Major Project).

Two parts:
- **Crumb:** an overlay on the Instagram-style reels feed that flags commercial and health-claim signals as the reel plays, with a short peek card.
- **Breadcrumb:** a moderated, crowd-sourced platform where every reel has a thread: trust signals, verified sources, friends' reviews, discussion, and a route to professional care.

Success on a Breadcrumb thread, in priority order:
1. **The tester reaches a professional**: books a GP appointment, schedules a call, or calls healthdirect. This is the main goal.
2. **The tester understands the signals**: who profits and what the evidence says, and decides for themselves.
3. **The tester trusts peers over the creator**: friends' reviews and verified professionals shift their view more than the influencer did.

## Positioning

Research showed people trust peers and friends more than influencers, so Breadcrumb is **crowd-sourced and moderated**, with **people you know surfaced first**. Trust is shown as **three separate signals (money, evidence, community)** and never collapsed into one score: a single number implies certainty the brief warns against, and crowds can confidently upvote misinformation. Threads score at the **post level**; creators get a history profile, never a single creator score (a creator can be honest on one post and sponsored on the next, and creator scores invite brigading and defamation complaints).

## Operating Context

- A **Wizard of Oz prototype** for user testing. Detection is scripted: each reel's signals were generated ahead of time from its transcript and play back in sync with the video.
- Tested on testers' own phones (the user's iPhone 17 is the reference device), opened from a public Vercel link or saved to the home screen.
- The reels are real downloaded clips; every person, handle, stat, review and comment around them is fictional.

## Capabilities and Constraints

- **No verdicts, no medical advice (binding).** Never call content true, false, a scam, fake or dangerous. Describe what was found ("Paid partnership disclosed", "2 claims to check") and hedge detection honestly. Always route health decisions to a professional.
- **Australian context (binding).** healthdirect (1800 022 222, free 24/7 nurse line), GPs, Medicare and bulk billing, Australian clinics and terminology.
- **Fictional people around real clips** (confirmed project decision): brand names appear only where the video itself says them.
- Booking and calling are mock flows inside the prototype; nothing is really booked. The healthdirect phone link is real.
- Reviews written by testers are stored only on their device.
- Out of scope: real Instagram integration, real-time detection, login, a real backend.
- Undecided: onboarding, the dev panel (chip-style A/B, swipe-to-scan), start-a-thread. The Crumb widget (states, glow, peek card, interaction) is being redesigned by the user.

## Brand Commitments

- Names: **Breadcrumb** (the platform) and **Crumb** (the overlay).
- Voice: neutral, factual, plain verbs, sentence case; buttons say exactly what happens.

## Evidence on Hand

- Verified sources per thread in `lib/data/threads.ts` (PubMed/PMC papers, healthdirect, TGA via RACGP newsGP, FDA, National Psoriasis Foundation), checked 2026-10-09. Never cite a source that hasn't been verified.
- No real user reviews, testimonials or usage data exist; all community content is fictional and must stay clearly prototype content.

## Product Principles

1. **Get them to a professional.** Every thread ends in a clear, low-effort route to real care.
2. **Inform, never decide.** Show what was found and what sources say; the person makes the call.
3. **Peers before promoters.** People you know, then verified professionals, then everyone else.
4. **Three signals, never one score.** Money, evidence and community stay separate and honest about uncertainty.
5. **Calm by default.** Only hard-flagged posts get emphasis; grey-area posts state facts quietly and clean posts stay silent.
