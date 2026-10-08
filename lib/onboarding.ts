// First-run tutorial on the first reel, independent of how it is drawn.
//
// The reel pauses at each stage and a ghost hand loops the gesture until the
// tester does it for real; the tutorial moves on when Crumb reports it
// happened (it never guesses from a timer).
//
//   intro    a welcome card over the paused first frame; "Start" turns the
//            sound on (iPhones only allow it from a tap) and plays the reel
//   listen   Crumb's scan glow on landing; no gesture, the reel plays
//   flag     the first chip appears, the reel pauses: tap it
//   peek     the peek card is open: tap × to close
//   hold     press and hold Crumb to turn it off
//   return   Crumb is off: swipe the tab on the left to bring it back
//   done     the reel plays again: swipe up for the next reel
//   finished the tutorial is over (or was skipped)

export type TutorialStep = "intro" | "listen" | "flag" | "peek" | "hold" | "return" | "done" | "finished";

export type TutorialEvent =
  | { type: "START"; at?: TutorialStep }
  | { type: "BEGIN" }
  | { type: "CRUMB_ANNOUNCED" }
  | { type: "CRUMB_OPENED" }
  | { type: "CRUMB_CLOSED" }
  | { type: "CRUMB_OFF" }
  | { type: "CRUMB_ON" }
  | { type: "NEXT_REEL" }
  | { type: "SKIP" };

export type Gesture = "tap" | "hold" | "swipe-right" | "swipe-up";

export interface TutorialCopy {
  title: string;
  body: string; // *starred* words are highlighted in Crumb ink
  gesture: Gesture | null;
  target: "widget" | "close" | "tab" | "feed" | null; // where the ghost hand acts
  coach: "above-widget" | "top" | "center";
}

export const TUTORIAL_COPY: Record<Exclude<TutorialStep, "finished">, TutorialCopy> = {
  intro: {
    title: "Meet Crumb",
    body: "A one-minute tour on a real reel. Turn your sound on, then *try each gesture* yourself.",
    gesture: null,
    target: null,
    coach: "center",
  },
  listen: {
    title: "This is Crumb",
    body: "It listens to each reel for *money and health-claim signals*.",
    gesture: null,
    target: null,
    coach: "above-widget",
  },
  flag: {
    title: "Crumb found something",
    body: "*Tap it* to see what it found.",
    gesture: "tap",
    target: "widget",
    coach: "above-widget",
  },
  peek: {
    title: "Everything in one place",
    body: "Each flag, the evidence and what people you know said. *See the thread* opens the full page. *Tap ×* to close it for now.",
    gesture: "tap",
    target: "close",
    coach: "top",
  },
  hold: {
    title: "Need it out of the way?",
    body: "*Press and hold* Crumb to turn it off.",
    gesture: "hold",
    target: "widget",
    coach: "above-widget",
  },
  return: {
    title: "Crumb is off",
    body: "*Swipe the tab* on the left to bring it back.",
    gesture: "swipe-right",
    target: "tab",
    coach: "above-widget",
  },
  done: {
    title: "That's Crumb",
    body: "It keeps listening as you scroll. *Swipe up* for the next reel.",
    gesture: "swipe-up",
    target: "feed",
    coach: "top",
  },
};

// The stages shown as progress dots (listen counts as the first).
export const TUTORIAL_STEPS: TutorialStep[] = ["listen", "flag", "peek", "hold", "return", "done"];

export function tutorialReducer(step: TutorialStep, event: TutorialEvent): TutorialStep {
  if (event.type === "START") return event.at ?? "intro";
  if (event.type === "SKIP") return "finished";
  // Turning Crumb off early skips ahead to bringing it back.
  if (event.type === "CRUMB_OFF" && step !== "done" && step !== "finished") return "return";

  switch (step) {
    case "intro":
      return event.type === "BEGIN" ? "listen" : step;
    case "listen":
      return event.type === "CRUMB_ANNOUNCED" ? "flag" : event.type === "CRUMB_OPENED" ? "peek" : step;
    case "flag":
      return event.type === "CRUMB_OPENED" ? "peek" : step;
    case "peek":
      return event.type === "CRUMB_CLOSED" ? "hold" : step;
    case "return":
      return event.type === "CRUMB_ON" ? "done" : step;
    case "done":
      return event.type === "NEXT_REEL" ? "finished" : step;
    default:
      return step;
  }
}

// The reel waits while the tester tries each gesture.
export function tutorialPausesReel(step: TutorialStep): boolean {
  return step === "intro" || step === "flag" || step === "peek" || step === "hold" || step === "return";
}

// Until the last stage, the feed stays put and only Crumb responds.
export function tutorialLocksFeed(step: TutorialStep): boolean {
  return step !== "done" && step !== "finished";
}

// Keep the first chip on screen until it's tapped.
export function tutorialHoldsChip(step: TutorialStep): boolean {
  return step === "flag";
}

// Opening a thread mid-tutorial (from the peek card) carries on afterwards
// with the next stage.
export function resumeStepAfterThread(step: TutorialStep): TutorialStep {
  return step === "peek" || step === "flag" || step === "listen" || step === "intro" ? "hold" : step;
}

// Two links for testing: `/onboarding` (→ `/reels?tutorial=1`) always starts
// with the tutorial; plain `/reels` never shows it.
export function shouldStartTutorial(opts: { requested: boolean; startIndex: number; startTime: number }): boolean {
  return opts.requested && opts.startIndex === 0 && opts.startTime === 0;
}
