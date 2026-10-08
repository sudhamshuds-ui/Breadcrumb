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
//   open        The widget has opened into its card: the peek card when there
//               are flags, otherwise "Nothing flagged yet".

export type CrumbStatus = "off" | "scanning" | "dormant" | "signals";
export type ActivationMode = "always-on" | "swipe-to-scan";

export interface CrumbState {
  status: CrumbStatus;
  mode: ActivationMode;
  found: string[]; // ids of signals found on the current reel
  announcing: string | null;
  open: boolean;
}

export type CrumbEvent =
  | { type: "REEL_ENTER" }
  | { type: "SIGNAL_DUE"; id: string }
  | { type: "ANNOUNCE_DONE"; id: string }
  | { type: "SCAN_COMPLETE" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "TURN_OFF" }
  | { type: "TURN_ON"; alreadySaid: string[] } // signals already said in this reel
  | { type: "SET_MODE"; mode: ActivationMode };

// How long a flag stays stretched out as a chip before folding back.
export const ANNOUNCE_MS = 3200;

export function initialCrumbState(enabled = true, mode: ActivationMode = "always-on"): CrumbState {
  return {
    status: enabled ? "scanning" : "off",
    mode,
    found: [],
    announcing: null,
    open: false,
  };
}

export function isListening(status: CrumbStatus): boolean {
  return status !== "off";
}

export function crumbReducer(state: CrumbState, event: CrumbEvent): CrumbState {
  switch (event.type) {
    case "REEL_ENTER": {
      const base = { ...state, found: [], announcing: null, open: false };
      return state.status === "off" ? base : { ...base, status: "scanning" };
    }

    case "SIGNAL_DUE": {
      if (!isListening(state.status) || state.found.includes(event.id)) return state;
      return {
        ...state,
        status: "signals",
        found: [...state.found, event.id],
        // Announce it, unless the card is already open and showing it.
        announcing: state.open ? null : event.id,
      };
    }

    case "ANNOUNCE_DONE":
      return state.announcing === event.id ? { ...state, announcing: null } : state;

    case "SCAN_COMPLETE":
      if (state.status !== "scanning" || state.found.length > 0) return state;
      return { ...state, status: "dormant" };

    case "OPEN":
      if (state.status === "off") return state;
      return { ...state, open: true, announcing: null };

    case "CLOSE":
      return state.open ? { ...state, open: false } : state;

    case "TURN_OFF":
      return { ...state, status: "off", found: [], announcing: null, open: false };

    case "TURN_ON":
      // Coming back always brings the plain widget, never a chip: what was
      // already said in this reel counts as found, quietly, behind the badge.
      if (state.status !== "off") return state;
      return {
        ...state,
        status: event.alreadySaid.length > 0 ? "signals" : "scanning",
        found: event.alreadySaid,
        announcing: null,
        open: false,
      };

    case "SET_MODE":
      return { ...state, mode: event.mode };
  }
}
