import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        path.join(__dirname, "lib/generated/prisma/**/*"),
        path.join(__dirname, "node_modules/.prisma/**/*"),
        path.join(__dirname, "node_modules/@prisma/engines/**/*"),
      ],
    },
  },
};

export default nextConfig;