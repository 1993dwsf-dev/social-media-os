// Daily cleanup is paginated across all accounts; no global table scan in a
// single transaction. Existing auth table schemas and data are preserved.
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const cleanupInactiveSessions = internalMutation({
  args: {
    phase: v.optional(v.union(v.literal("tokens"), v.literal("sessions"))),
    cursor: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { phase = "tokens", cursor },
  ): Promise<{ sessions: number; refreshTokens: number }> => {
    const now = Date.now();
    let deletedTokens = 0;
    if (phase === "tokens") {
      const batch = await ctx.db
        .query("authRefreshTokens")
        .paginate({ cursor: cursor ?? null, numItems: 200 });
      for (const token of batch.page) {
        const session = await ctx.db.get(token.sessionId);
        if (
          token.expirationTime <= now ||
          !session ||
          session.expirationTime <= now
        ) {
          await ctx.db.delete(token._id);
          deletedTokens++;
        }
      }
      if (!batch.isDone) {
        await ctx.scheduler.runAfter(
          0,
          internal.sessions.cleanupInactiveSessions,
          { phase: "tokens", cursor: batch.continueCursor },
        );
        return { sessions: 0, refreshTokens: deletedTokens };
      }
      await ctx.scheduler.runAfter(
        0,
        internal.sessions.cleanupInactiveSessions,
        { phase: "sessions" },
      );
      return { sessions: 0, refreshTokens: deletedTokens };
    }
    const batch = await ctx.db
      .query("authSessions")
      .paginate({
        cursor: phase === "sessions" ? (cursor ?? null) : null,
        numItems: 200,
      });
    let deletedSessions = 0;
    for (const session of batch.page) {
      const liveToken = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .filter((q) => q.gt(q.field("expirationTime"), now))
        .first();
      if (session.expirationTime <= now || !liveToken) {
        await ctx.db.delete(session._id);
        deletedSessions++;
      }
    }
    if (!batch.isDone)
      await ctx.scheduler.runAfter(
        0,
        internal.sessions.cleanupInactiveSessions,
        { phase: "sessions", cursor: batch.continueCursor },
      );
    return { sessions: deletedSessions, refreshTokens: deletedTokens };
  },
});
