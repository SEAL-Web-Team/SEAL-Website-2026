import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: hosts allowed to load /_next/ resources. Without the right entry
  // here, the browser silently gets no client JS and pages render as dead HTML.
  allowedDevOrigins: ["bestop.tail0ff8e.ts.net", "127.0.0.1"],
};

export default nextConfig;
