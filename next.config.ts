import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // Skip ESLint during build process
  }
  /* config options here */
};

export default nextConfig;
