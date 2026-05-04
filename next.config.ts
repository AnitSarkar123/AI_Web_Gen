import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  images: {
    remotePatterns: [
      {
        hostname: "3lbm6vryvm.ufs.sh",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@prisma/client");
    }
    return config;
  },
  experimental: {
    outputFileTracingIncludes: {
      "/**": [
        path.join(process.cwd(), "lib/generated/prisma/**/*"),
        path.join(process.cwd(), "node_modules/.prisma/**/*"),
        path.join(process.cwd(), "node_modules/@prisma/engines/**/*"),
      ],
    },
  },
};

export default nextConfig;