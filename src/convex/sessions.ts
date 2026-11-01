// Expiração e limpeza das sessões de login do Social Media OS.
//
// O Convex Auth já cria cada sessão com prazos: `authSessions.expirationTime`
// é a duração total (30 dias) e `authRefreshTokens.expirationTime` é a janela
// de inatividade — cada renovação emite um token novo e empurra esse prazo.
// A biblioteca **recusa** a renovação depois do prazo (e apaga a sessão nessa
// tentativa), mas quem nunca volta deixaria a sessão e os tokens vencidos no
// banco para sempre. É isso que esta função interna limpa, numa passada só:
//
//   1. tokens de refresh vencidos — inclusive os de sessão que já morreu;
//   2. sessões vencidas e sessões que ficaram sem nenhum refresh vivo (não há
//      mais como renová-las).
//
// A função é **interna** (o cliente não alcança) e roda no cron diário
// (`src/convex/crons.ts`). As tabelas do auth não têm índice por prazo e o
// produto é single-seat — a varredura completa de um punhado de linhas é
// barata e não justifica mudar o schema do template.

import { internalMutation } from "./_generated/server";

export const cleanupInactiveSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const sessions = await ctx.db.query("authSessions").collect();
    const tokens = await ctx.db.query("authRefreshTokens").collect();
    const sessionIds = new Set(sessions.map((session) => session._id));

    // Quantos refresh tokens ainda vivos cada sessão tem.
    const liveTokensBySession = new Map<string, number>();
    for (const token of tokens) {
      if (token.expirationTime > now && sessionIds.has(token.sessionId)) {
        liveTokensBySession.set(
          token.sessionId,
          (liveTokensBySession.get(token.sessionId) ?? 0) + 1,
        );
      }
    }

    // Sessão morta: passou do prazo total ou ficou sem nenhum refresh vivo.
    const deadSessions = new Set(
      sessions
        .filter(
          (session) =>
            session.expirationTime <= now ||
            (liveTokensBySession.get(session._id) ?? 0) === 0,
        )
        .map((session) => session._id),
    );

    let deletedTokens = 0;
    for (const token of tokens) {
      const expired = token.expirationTime <= now;
      const sessionGone =
        !sessionIds.has(token.sessionId) || deadSessions.has(token.sessionId);
      if (expired || sessionGone) {
        await ctx.db.delete(token._id);
        deletedTokens += 1;
      }
    }

    let deletedSessions = 0;
    for (const session of sessions) {
      if (deadSessions.has(session._id)) {
        await ctx.db.delete(session._id);
        deletedSessions += 1;
      }
    }

    return { sessions: deletedSessions, refreshTokens: deletedTokens };
  },
});
