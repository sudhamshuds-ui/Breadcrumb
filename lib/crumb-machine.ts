// Crumb's state, independent of how it is drawn.
//
// One widget does everything (2026-10-09 redesign after workplace testing:
// people had to watch the handle, a screen glow, chips and the reel at once).
//
//   off       Crumb is turned off; only a slim tab at the left edge remains.
//   scanning  New reel: Crumb is listening (glow is alive).
//   dormant   Listened and found nothing; plain widget, no glow.
//   signals   Something was flagged; widget wears a badge with the count.
//
// On top of the status:
//   announcing  The signal currently shown as a chip (the widget stretches
//               into a chip for a few seconds, then folds back with a badge).
//   queue       Flags found while a chip was showing or the widget was
//               resting; they wait their turn so chips never come back to back.
//   resting     The pause after a chip folds back, before the next one.
//   open        The widget has opened into its card: the peek card when there
//               are flags, otherwise "Nothing flagged yet".

export type CrumbStatus = "off" | "scanning" | "dormant" | "signals";
export type ActivationMode = "always-on" | "swipe-to-scan";

export interface CrumbState {
  status: CrumbStatus;
  mode: ActivationMode;
  found: string[]; // ids of signals found on the current reel
  announcing: string | null;
  queue: string[];
  resting: boolean;
  open: boolean;
}

export type CrumbEvent =
  | { type: "REEL_ENTER" }
  | { type: "SIGNAL_DUE"; id: string }
  | { type: "ANNOUNCE_DONE"; id: string }
  | { type: "REST_DONE" }
  | { type: "SCAN_COMPLETE" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TURN_OFF" }
  | { type: "TURN_ON"; alreadySaid: string[] } // signals already said in this reel
  | { type: "CATCH_UP"; alreadySaid: string[] } // resuming mid-reel (back from a thread)
  | { type: "SET_MODE"; mode: ActivationMode };

// How long a flag stays stretched out as a chip before folding back, and the
// minimum rest as a plain widget before the next chip.
export const ANNOUNCE_MS = 3000;
export const REST_MS = 2000;

// Flags the tester has actually seen (the badge count): found minus queued.
export function shownCount(state: CrumbState): number {
  return state.found.length - state.queue.length;
}

export function initialCrumbState(enabled = true, mode: ActivationMode = "always-on"): CrumbState {
  return {
    status: enabled ? "scanning" : "off",
    mode,
    found: [],
    announcing: null,
    queue: [],
    resting: false,
    open: false,
  };
}

export function isListening(status: CrumbStatus): boolean {
  return status !== "off";
}

export function crumbReducer(state: CrumbState, event: CrumbEvent): CrumbState {
  switch (event.type) {
    case "REEL_ENTER": {
      const base = { ...state, found: [], announcing: null, queue: [], resting: false, open: false };
      return state.status === "off" ? base : { ...base, status: "scanning" };
    }

    case "SIGNAL_DUE": {
      if (!isListening(state.status) || state.found.includes(event.id)) return state;
      const found = [...state.found, event.id];
      // The card is open and already lists it.
      if (state.open) return { ...state, status: "signals", found };
      // A chip is showing or the widget is resting: wait in line.
      if (state.announcing || state.resting) {
        return { ...state, status: "signals", found, queue: [...state.queue, event.id] };
      }
      return { ...state, status: "signals", found, announcing: event.id };
    }

    case "ANNOUNCE_DONE":
      return state.announcing === event.id ? { ...state, announcing: null, resting: true } : state;

    case "REST_DONE": {
      if (!state.resting) return state;
      const [next, ...rest] = state.queue;
      return next ? { ...state, resting: false, announcing: next, queue: rest } : { ...state, resting: false };
    }

    case "SCAN_COMPLETE":
      if (state.status !== "scanning" || state.found.length > 0) return state;
      return { ...state, status: "dormant" };

    case "OPEN":
      if (state.status === "off") return state;
      // The card lists everything, queued flags included.
      return { ...state, open: true, announcing: null, queue: [], resting: false };

    case "CLOSE":
      return state.open ? { ...state, open: false } : state;

    case "TURN_OFF":
      return { ...state, status: "off", found: [], announcing: null, queue: [], resting: false, open: false };

    case "TURN_ON":
      // Coming back always brings the plain widget, never a chip: what was
      // already said in this reel counts as found, quietly, behind the badge,
      // and it starts with a breather, so a flag due right now waits its turn
      // instead of stretching the widget while it slides back in.
      if (state.status !== "off") return state;
      return {
        ...state,
        status: event.alreadySaid.length > 0 ? "signals" : "scanning",
        found: event.alreadySaid,
        announcing: null,
        queue: [],
        resting: true,
        open: false,
      };

    case "CATCH_UP":
      // Resuming partway through a reel: what was already said counts as
      // found, quietly, so nothing old is re-announced as a chip.
      if (state.status === "off" || event.alreadySaid.length === 0) return state;
      return { ...state, status: "signals", found: event.alreadySaid, announcing: null, queue: [], resting: false };

    case "SET_MODE":
      return { ...state, mode: event.mode };
  }
}
