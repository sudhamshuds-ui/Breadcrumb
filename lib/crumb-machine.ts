// Crumb's state logic. A plain reducer so it is easy to test and so the UI
// can be rebuilt without touching it.
//
//  off       nothing on screen
//  paused    dim handle, no scanning
//  dormant   thin handle on the right edge
//  scanning  handle shimmers while Crumb "reads" the reel
//  signals   handle glows, chip appears
//  peek      peek card open

export type CrumbStatus = "off" | "paused" | "dormant" | "scanning" | "signals" | "peek";
export type ActivationMode = "always-on" | "swipe-to-scan";

export interface CrumbState {
  status: CrumbStatus;
  mode: ActivationMode;
  revealed: boolean; // handle pulled out from the edge
  menuOpen: boolean; // toggle pill (pause, turn off, open Breadcrumb)
  found: string[]; // ids of signals found on the current reel
}

export type CrumbEvent =
  | { type: "REEL_ENTER" }
  | { type: "SIGNAL_DUE"; id: string }
  | { type: "SCAN_COMPLETE" }
  | { type: "REVEAL" }
  | { type: "CAPTION_OPENED" }
  | { type: "TUCK" }
  | { type: "TOGGLE_MENU" }
  | { type: "CLOSE_MENU" }
  | { type: "OPEN_PEEK" }
  | { type: "CLOSE_PEEK" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "TURN_OFF" }
  | { type: "TURN_ON" }
  | { type: "SET_MODE"; mode: ActivationMode };

export function initialCrumbState(enabled = true, mode: ActivationMode = "always-on"): CrumbState {
  return {
    status: enabled ? (mode === "always-on" ? "scanning" : "dormant") : "off",
    mode,
    revealed: false,
    menuOpen: false,
    found: [],
  };
}

const LISTENING: CrumbStatus[] = ["scanning", "signals", "peek"];

export function isListening(status: CrumbStatus): boolean {
  return LISTENING.includes(status);
}

export function crumbReducer(state: CrumbState, event: CrumbEvent): CrumbState {
  switch (event.type) {
    case "REEL_ENTER": {
      const base = { ...state, revealed: false, menuOpen: false, found: [] };
      if (state.status === "off" || state.status === "paused") return base;
      return { ...base, status: state.mode === "always-on" ? "scanning" : "dormant" };
    }

    case "SIGNAL_DUE": {
      if (!isListening(state.status) || state.found.includes(event.id)) return state;
      return {
        ...state,
        found: [...state.found, event.id],
        status: state.status === "peek" ? "peek" : "signals",
      };
    }

    case "SCAN_COMPLETE":
      if (state.status !== "scanning" || state.found.length > 0) return state;
      return { ...state, status: "dormant" };

    case "REVEAL": {
      // In swipe-to-scan mode, pulling Crumb out is what starts the scan.
      const startScan = state.mode === "swipe-to-scan" && state.status === "dormant";
      return { ...state, revealed: true, status: startScan ? "scanning" : state.status };
    }

    case "CAPTION_OPENED":
      // Opening the caption brings Crumb out beside the shrunk reel, but only
      // when it has something to show.
      return state.status === "signals" ? { ...state, revealed: true } : state;

    case "TUCK":
      return {
        ...state,
        revealed: false,
        menuOpen: false,
        status: state.status === "peek" ? "signals" : state.status,
      };

    case "TOGGLE_MENU":
      if (!state.revealed) return state;
      return {
        ...state,
        menuOpen: !state.menuOpen,
        status: state.status === "peek" ? "signals" : state.status,
      };

    case "CLOSE_MENU":
      return { ...state, menuOpen: false };

    case "OPEN_PEEK":
      if (state.found.length === 0) return state;
      return { ...state, status: "peek", menuOpen: false };

    case "CLOSE_PEEK":
      return state.status === "peek" ? { ...state, status: "signals" } : state;

    case "PAUSE":
      return { ...state, status: "paused", menuOpen: false, revealed: false, found: [] };

    case "RESUME":
    case "TURN_ON":
      return {
        ...state,
        status: state.mode === "always-on" ? "scanning" : "dormant",
        menuOpen: false,
        found: [],
      };

    case "TURN_OFF":
      return { ...state, status: "off", menuOpen: false, revealed: false, found: [] };

    case "SET_MODE":
      return { ...state, mode: event.mode };
  }
}
