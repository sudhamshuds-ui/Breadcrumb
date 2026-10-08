"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReelsApp } from "./ReelsApp";

// Next.js keeps this page alive, hidden, while a thread is open, and shows
// it again exactly as it was: the peek card still open, the reel paused, and
// Crumb's morph animations measured while invisible (which left the widget
// untappable on iPhone). The feed is built to resume from its link instead
// (`?reel=…&t=…`, saved before a thread opens), so start it fresh on every
// visit: a new key when the page is hidden, and on each fresh navigation.
export function ReelsRoute() {
  const { bfcacheId } = useRouter();
  const [visit, setVisit] = useState(0);
  useLayoutEffect(
    () => () => {
      // Only when the page is really being left (the URL has moved on), not
      // when React re-runs effects in development.
      if (window.location.pathname !== "/reels") setVisit((v) => v + 1);
    },
    [],
  );
  return <ReelsApp key={`${bfcacheId}:${visit}`} />;
}
