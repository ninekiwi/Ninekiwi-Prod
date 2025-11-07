import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // Increase chunk load timeout to avoid spurious timeouts on slow networks/devices
    // @ts-ignore - not typed on Next's webpack output type
    config.output = config.output || {};
    // @ts-ignore
    config.output.chunkLoadTimeout = 120000; // 2 minutes
    return config;
  },
};

export default nextConfig;
