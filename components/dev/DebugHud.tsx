"use client";

import { useEffect, useState } from "react";
import { isShortHomeScreen } from "@/components/phone/PhoneFrame";

// On-device diagnostics for bugs that only happen on the iPhone. Switch on
// with any URL ending `?debug=1` (remembered on the device, survives
// navigation), off with `?debug=0`; or tap the top-left corner (the "Reels"
// title) 5 times quickly, which works in the home-screen app too (it has no
// address bar, and its storage is separate from Safari's). Shows, for each touch: what iOS says is
// under the finger, what the page draws there, and whether a click followed;
// plus window, viewport and scroll measurements. Never shown to testers.

const KEY = "crumb.debug";

function describe(el: Element | null): string {
  if (!el) return "none";
  const tagged = el.closest("[data-tutorial],[aria-label],button,a,[data-interactive]");
  const t = tagged ?? el;
  const label =
    t.getAttribute("data-tutorial") ?? t.getAttribute("aria-label")?.slice(0, 22) ?? (t as HTMLElement).innerText?.slice(0, 16) ?? "";
  return `${t.tagName.toLowerCase()}${label ? `"${label.replace(/\s+/g, " ").trim()}"` : ""}`;
}

export function DebugHud() {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [metrics, setMetrics] = useState("");

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("debug");
      if (q === "1") window.localStorage.setItem(KEY, "1");
      if (q === "0") window.localStorage.removeItem(KEY);
      // Read after hydration: the server never knows this device's setting.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOn(window.localStorage.getItem(KEY) === "1");
    } catch {}
  }, []);

  // Hidden switch: 5 quick taps in the top-left corner.
  useEffect(() => {
    let taps: number[] = [];
    const onEnd = (e: TouchEvent) => {
      const p = e.changedTouches[0];
      if (!p || p.clientX > 150 || p.clientY > 120) return;
      const now = Date.now();
      taps = [...taps.filter((t) => now - t < 2000), now];
      if (taps.length < 5) return;
      taps = [];
      setOn((was) => {
        try {
          if (was) window.localStorage.removeItem(KEY);
          else window.localStorage.setItem(KEY, "1");
        } catch {}
        return !was;
      });
    };
    window.addEventListener("touchend", onEnd, { capture: true, passive: true });
    return () => window.removeEventListener("touchend", onEnd, { capture: true });
  }, []);

  useEffect(() => {
    if (!on) return;
    const log = (s: string) => setLines((l) => [s, ...l].slice(0, 9));
    const onTouch = (e: TouchEvent) => {
      const p = e.touches[0];
      if (!p) return;
      const drawn = document.elementFromPoint(p.clientX, p.clientY);
      log(`touch ${Math.round(p.clientX)},${Math.round(p.clientY)} hit=${describe(e.target as Element)} drawn=${describe(drawn)}`);
    };
    const onClick = (e: MouseEvent) => log(`click ${Math.round(e.clientX)},${Math.round(e.clientY)} → ${describe(e.target as Element)}`);
    const onCancel = () => log("touchcancel (iOS took the touch)");
    window.addEventListener("touchstart", onTouch, { capture: true, passive: true });
    window.addEventListener("click", onClick, { capture: true });
    window.addEventListener("touchcancel", onCancel, { capture: true, passive: true });

    const measure = () => {
      const vv = window.visualViewport;
      const frame = document.querySelector(".phone-ui")?.getBoundingClientRect();
      const w = document.querySelector('[data-tutorial="widget"]')?.getBoundingClientRect();
      const status = document.querySelector("[data-crumb-status]")?.getAttribute("data-crumb-status");
      const widgets = document.querySelectorAll('[data-tutorial="widget"]').length;
      setMetrics(
        [
          `${window.location.pathname}${window.location.search}`,
          `inner ${window.innerWidth}x${window.innerHeight} screen ${screen.width}x${screen.height}`,
          `vv h${Math.round(vv?.height ?? 0)} top${Math.round(vv?.offsetTop ?? 0)} scrollY ${Math.round(window.scrollY)}`,
          `frame top${Math.round(frame?.top ?? -1)} h${Math.round(frame?.height ?? -1)} home=${(navigator as Navigator & { standalone?: boolean }).standalone ? "flag" : ""}${matchMedia("(display-mode: standalone)").matches ? "+manifest" : ""} short=${isShortHomeScreen() ? "yes" : "no"} locked=${document.documentElement.classList.contains("page-locked") ? "yes" : "no"}`,
          `widget ${w ? `${Math.round(w.left)},${Math.round(w.top)} ${Math.round(w.width)}x${Math.round(w.height)}` : "none"} ×${widgets} status=${status ?? "-"} card=${document.querySelector('[role="dialog"]') ? "open" : "closed"}`,
        ].join("\n"),
      );
    };
    measure();
    const id = setInterval(measure, 400);
    return () => {
      window.removeEventListener("touchstart", onTouch, { capture: true });
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("touchcancel", onCancel, { capture: true });
      clearInterval(id);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-1 z-[999] rounded-lg bg-black/80 p-1.5 font-mono text-[9.5px] leading-[1.35] whitespace-pre-wrap text-[#7CFFB2]"
      style={{ top: "calc(env(safe-area-inset-top) + 40px)" }}
    >
      {metrics}
      {"\n—\n"}
      {lines.join("\n")}
    </div>
  );
}
