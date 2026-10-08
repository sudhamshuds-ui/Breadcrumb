"use client";

import { useEffect, useState } from "react";

// TEMPORARY: measures the screen on a real iPhone to find the bottom gap in
// home-screen mode. Remove once the gap is fixed.
export function ViewportDebug() {
  const [lines, setLines] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0";
    document.body.appendChild(probe);
    const read = () => {
      const cs = getComputedStyle(probe);
      const app = document.querySelector(".phone-ui")?.getBoundingClientRect();
      const nav = window.navigator as Navigator & { standalone?: boolean };
      setLines([
        `standalone ${nav.standalone} / mq ${window.matchMedia("(display-mode: standalone)").matches}`,
        `screen ${screen.width}x${screen.height}`,
        `inner ${innerWidth}x${innerHeight}  outer ${outerHeight}`,
        `visual ${Math.round(visualViewport?.height ?? 0)} off ${Math.round(visualViewport?.offsetTop ?? 0)}`,
        `docEl ${document.documentElement.clientHeight}  scrollY ${scrollY}`,
        `safe top ${cs.paddingTop} bottom ${cs.paddingBottom}`,
        `app top ${Math.round(app?.top ?? -1)} bottom ${Math.round(app?.bottom ?? -1)} h ${Math.round(app?.height ?? -1)}`,
        `app class standalone: ${document.querySelector(".phone-ui")?.classList.contains("standalone")}`,
      ]);
    };
    read();
    const id = setInterval(read, 500);
    return () => {
      clearInterval(id);
      probe.remove();
    };
  }, []);

  const tryFix = (name: string, fn: () => void) => {
    fn();
    setTimeout(() => setLog((l) => [...l, `${name} done`]), 300);
  };

  return (
    <div
      data-interactive
      className="pointer-events-auto absolute left-2 top-[110px] z-[100] max-w-[300px] rounded-lg bg-black/80 p-2 font-mono text-[10px] leading-[1.35] text-lime-300"
    >
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
      <div className="mt-1.5 flex gap-1.5">
        <button
          type="button"
          className="rounded bg-white/20 px-2 py-1 text-white"
          onClick={() =>
            tryFix("A scroll nudge", () => {
              window.scrollTo(0, 1);
              requestAnimationFrame(() => window.scrollTo(0, 0));
            })
          }
        >
          A
        </button>
        <button
          type="button"
          className="rounded bg-white/20 px-2 py-1 text-white"
          onClick={() =>
            tryFix("B resize", () => {
              window.dispatchEvent(new Event("resize"));
            })
          }
        >
          B
        </button>
      </div>
      {log.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
