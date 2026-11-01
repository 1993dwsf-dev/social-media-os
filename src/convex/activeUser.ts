import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Check revocation at the database too: a still-valid JWT cannot keep using a
// session deleted by logout or password recovery.
export async function activeUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  const rawSessionId = await getAuthSessionId(ctx);
  if (!userId || !rawSessionId) return null;
  const sessionId = ctx.db.normalizeId("authSessions", rawSessionId);
  if (!sessionId) return null;
  const session = await ctx.db.get(sessionId);
  return session &&
    session.userId === userId &&
    session.expirationTime > Date.now()
    ? userId
    : null;
}
