import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.genius.com",
      },
      {
        protocol: "https",
        hostname: "images.rapgenius.com",
      },
      {
        protocol: "https",
        hostname: "*.genius.com",
      },
    ],
  },
};

export default nextConfig;
