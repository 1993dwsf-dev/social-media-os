import type { AuthConfig } from "convex/server";

// Only trust JWTs issued by this Convex deployment; no Freebuff federation.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
