import type { AuthConfig } from "convex/server";

// Trust only tokens issued by this application deployment.
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
