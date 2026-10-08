import { redirect } from "next/navigation";

// The link for test sessions with the tutorial: the same feed, starting with
// the guided first reel every time it's opened. `/reels` has no tutorial.
export default function Onboarding() {
  redirect("/reels?tutorial=1");
}
