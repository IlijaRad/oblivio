import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "devapi.oblivio.brrm.eu",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "oblivio-dev.s3.eu-central-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
