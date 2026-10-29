import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js dev badge so screen recordings stay clean.
  devIndicators: false,
  // Off on purpose: with it on, Next keeps pages alive (hidden) and restores
  // them as they were, which left Crumb's widget untappable on iPhone after
  // coming back from a thread. The feed resumes from its URL instead.
  experimental: {
    // Set by the Next.js security upgrade (16.4.0 to 16.4.3).
    agentUpgrade: "security",
  },
};

export default nextConfig;
