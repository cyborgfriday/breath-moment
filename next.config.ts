import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export required for Chrome extension packaging
  // Output goes to `out/` — load that folder in chrome://extensions
  output: "export",
  trailingSlash: true,
  images: {
    // Required for static export (no Next.js image optimization server)
    unoptimized: true,
  },
};

export default nextConfig;
