import type { MetadataRoute } from "next";

// Tells the phone the whole site is one home-screen app. Without it, iOS
// guesses the app's "space" from the page the icon was added on, and pages
// outside that guess (e.g. a Breadcrumb thread) open in a browser view with
// an × and a toolbar instead of full screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Crumb prototype",
    short_name: "Crumb",
    description: "Wizard of Oz prototype of Crumb, an overlay that surfaces money and health-claim signals on reels.",
    id: "/",
    start_url: "/reels",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
