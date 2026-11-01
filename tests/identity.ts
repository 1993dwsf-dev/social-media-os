import type { convexTest } from "convex-test";
import type { Id } from "../src/convex/_generated/dataModel";

export async function signedIdentity(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
) {
  const sessionId = await t.run((ctx) =>
    ctx.db.insert("authSessions", {
      userId,
      expirationTime: Date.now() + 86_400_000,
    }),
  );
  return t.withIdentity({ subject: `${userId}|${sessionId}` });
}
