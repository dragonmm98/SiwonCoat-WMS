const configured = process.env.NEXT_PUBLIC_API_URL;
const configuredUsesLoopback = configured
  ? /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/)/.test(configured)
  : false;

// Development uses the Next.js same-origin proxy. An explicit non-loopback URL
// remains available for deployments where the API is hosted separately.
export const API_URL = configured && !configuredUsesLoopback
  ? configured.replace(/\/$/, "")
  : "/wms-data";
