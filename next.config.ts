import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
  },
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: process.env.SKIP_TYPE_CHECK === 'true',
  },
};

export default nextConfig;
