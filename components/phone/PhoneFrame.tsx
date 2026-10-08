"use client";

import { useEffect, useRef, useState } from "react";

const W = 390;
const H = 844;

// Home-screen app opened short of the screen (the black strip under the nav).
// iOS reports home-screen mode one of two ways depending on how the icon was
// added (old `standalone` flag, or the manifest's display mode), so check both.
export function isShortHomeScreen(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const homeScreen = nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  const portrait = window.innerHeight >= window.innerWidth;
  return homeScreen && portrait && window.innerHeight < Math.max(screen.width, screen.height) - 1;
}

// On phones the app fills the screen. On desktop it sits in a 390 × 844
// phone frame, scaled down to fit the window height.
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const uiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 40) / (H + 24)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // There used to be a "nudge" here for the home-screen black strip (scroll
  // the page 1px on every touch). It never fixed the strip, and on iPhone a
  // scroll during a touch cancels the tap. Removed on purpose; see CLAUDE.md.

  // Lock the page (globals.css) so it can't be pulled, except while the
  // home-screen app is open short: iOS sometimes leaves a black strip under
  // the nav until the page is pulled down once, so keep that pull possible
  // until the window fills the screen.
  //
  // While it's short, the app also stretches itself over the strip: the strip
  // is still the app's own area (painted with the page's black), iOS just
  // reports a shorter window. Sized to the full screen, the nav sits at the
  // real bottom and the strip is gone without any pull. (Inline !important,
  // because the phone layout's own sizes are !important in the class list.)
  useEffect(() => {
    const root = document.documentElement;
    let stretched = false;
    const update = () => {
      const short = isShortHomeScreen();
      root.classList.toggle("page-locked", !short);
      root.classList.toggle("page-pullable", short);
      const ui = uiRef.current;
      if (!ui) return;
      if (short) {
        ui.style.setProperty("height", `${Math.max(screen.width, screen.height)}px`, "important");
        ui.style.setProperty("bottom", "auto", "important");
        stretched = true;
      } else if (stretched) {
        // Back to the frame's own size (the desktop frame needs its height).
        ui.style.setProperty("height", `${H}px`);
        ui.style.removeProperty("bottom");
        stretched = false;
      }
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      root.classList.remove("page-locked", "page-pullable");
    };
  }, []);

  // Safety net: the page itself should never stay scrolled (see globals.css).
  // If iOS leaves it offset anyway (stuck after a pull, a bounce or a swipe
  // back), the picture and the touch areas drift apart and taps miss. Put it
  // back, but only once no finger is down: moving the page during a touch
  // cancels the tap.
  useEffect(() => {
    let fingers = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const offset = () => window.scrollY !== 0 || Math.abs(window.visualViewport?.offsetTop ?? 0) > 0.5;
    const settle = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // While the strip shows, leave the tester's pull-down alone: it's
        // what makes iOS give the app the full screen.
        if (fingers === 0 && offset() && !isShortHomeScreen()) window.scrollTo(0, 0);
      }, 150);
    };
    const down = (e: TouchEvent) => {
      fingers = e.touches.length;
      clearTimeout(timer);
    };
    const up = (e: TouchEvent) => {
      fingers = e.touches.length;
      if (fingers === 0) settle();
    };
    settle();
    window.addEventListener("touchstart", down, { passive: true, capture: true });
    window.addEventListener("touchend", up, { passive: true, capture: true });
    window.addEventListener("touchcancel", up, { passive: true, capture: true });
    window.addEventListener("scroll", settle, { passive: true });
    window.visualViewport?.addEventListener("scroll", settle);
    window.visualViewport?.addEventListener("resize", settle);
    window.addEventListener("pageshow", settle);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("touchstart", down, { capture: true });
      window.removeEventListener("touchend", up, { capture: true });
      window.removeEventListener("touchcancel", up, { capture: true });
      window.removeEventListener("scroll", settle);
      window.visualViewport?.removeEventListener("scroll", settle);
      window.visualViewport?.removeEventListener("resize", settle);
      window.removeEventListener("pageshow", settle);
    };
  }, []);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#2a2a2a] max-[499px]:bg-black">
      <div
        className="relative origin-center max-[499px]:![transform:none]"
        style={{ transform: `scale(${scale})` }}
      >
        <div
          ref={uiRef}
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
