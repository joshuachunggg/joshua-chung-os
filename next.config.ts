import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    return [
      // Expo web exports are SPAs: serve their index.html at the clean base
      // path so expo-router sees "/" after stripping its baseUrl.
      { source: "/b3vo", destination: "/b3vo/index.html" },
      { source: "/campus", destination: "/campus/index.html" },
      // Same-origin proxy for the embedded CAMPUS app's backend: its
      // Anything-hosted API sends no CORS headers, so the browser can only
      // reach it through us. Also makes auth cookies first-party.
      {
        source: "/campus-api/:path*",
        destination: "https://55909ab9-5db1-4778-8a55-a8ca8f74f90a.created.app/:path*",
      },
    ];
  },
};

export default nextConfig;
