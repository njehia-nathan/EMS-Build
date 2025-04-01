// @ts-nocheck
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "canny-lyrebird-937.convex.cloud", // Remove "https://"
      },
    ],
  },
};

export default nextConfig;