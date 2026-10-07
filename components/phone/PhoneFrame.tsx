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

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#2a2a2a] max-[499px]:bg-black">
      <div
        className="relative origin-center max-[499px]:![transform:none]"
        style={{ transform: `scale(${scale})` }}
      >
        <div
          className="phone-ui relative overflow-clip bg-black max-[499px]:!h-dvh max-[499px]:!w-screen max-[499px]:!rounded-none max-[499px]:!shadow-none"
          style={{
            width: W,
            height: H,
            borderRadius: 54,
            boxShadow: "0 0 0 12px #0b0b0b, 0 0 0 13px #3a3a3a, 0 40px 80px rgba(0,0,0,0.5)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
