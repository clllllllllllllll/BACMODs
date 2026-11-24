import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Self-contained server output; the Dockerfile copies .next/standalone.
  output: "standalone",
  // AGENTS.md is maintained by hand; docs/AGENT_GUIDE.md covers the Next.js docs note.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
