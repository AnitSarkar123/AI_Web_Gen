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
  outputFileTracingIncludes: {
    "/**": [
      path.join(process.cwd(), "lib/generated/prisma/**/*"),
      path.join(process.cwd(), "node_modules/.prisma/**/*"),
      path.join(process.cwd(), "node_modules/@prisma/engines/**/*"),
      path.join(process.cwd(), "node_modules/@prisma/**/*"),
    ],
  },
  // Ensure Prisma client is available to serverless functions
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;