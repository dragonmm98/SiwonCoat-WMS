import type { NextConfig } from "next";

const apiProxyTarget = (
  process.env.API_PROXY_TARGET ?? "http://127.0.0.1:4000/api/v1"
).replace(/\/$/, "");

const configuredDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Next blocks dev assets loaded through a tunnel unless its hostname is
  // explicitly trusted. This option is ignored by production builds.
  allowedDevOrigins: ["*.ngrok-free.app", ...configuredDevOrigins],
  async rewrites() {
    return [
      {
        source: "/wms-data/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
