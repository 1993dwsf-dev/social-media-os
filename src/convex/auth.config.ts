import type { AuthConfig } from "convex/server";

// Trust only JWTs issued by this Convex deployment.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
