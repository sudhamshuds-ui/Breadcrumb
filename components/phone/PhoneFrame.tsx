"use client";

import { useEffect, useState } from "react";

const W = 390;
const H = 844;

// On phones the app fills the screen. On desktop it sits in a 390 × 844
// phone frame, scaled down to fit the window height.
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 40) / (H + 24)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Home-screen app on iPhone: iOS sometimes opens the app in a window that is
  // short by the status bar's height (a black strip under the nav) until the
  // page is pulled down. Do that tiny pull-down ourselves on open.
  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (nav.standalone !== true) return;
    const root = document.documentElement;
    const nudge = () => {
      root.style.minHeight = "calc(100% + 1px)"; // give the page 1px to scroll
      window.scrollTo(0, 1);
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        setTimeout(() => (root.style.minHeight = ""), 300);
      });
    };
    // iOS ignores it if it runs too early, so retry after load and on the
    // first touch; once the window is full height there's nothing left to do.
    const fixed = () => window.innerHeight >= Math.max(screen.width, screen.height) - 1;
    const tryNudge = () => {
      const portrait = window.innerHeight >= window.innerWidth;
      if (portrait && !fixed()) nudge();
    };
    const timers = [300, 800, 1600].map((ms) => setTimeout(tryNudge, ms));
    window.addEventListener("load", tryNudge);
    window.addEventListener("touchstart", tryNudge, { passive: true });
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("load", tryNudge);
      window.removeEventListener("touchstart", tryNudge);
    };
  }, []);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#2a2a2a] max-[499px]:bg-black">
      <div
        className="relative origin-center max-[499px]:![transform:none]"
        style={{ transform: `scale(${scale})` }}
      >
        <div
          className={`phone-ui relative overflow-clip bg-black max-[499px]:!fixed max-[499px]:!inset-0 max-[499px]:!h-auto max-[499px]:!w-auto max-[499px]:!rounded-none max-[499px]:!shadow-none`}
          style={{
            width: W,
            height: H,
            borderRadius: 54,
            boxShadow: "0 0 0 12px #0b0b0b, 0 0 0 13px #3a3a3a, 0 40px 80px rgba(0,0,0,0.5)",
          } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
