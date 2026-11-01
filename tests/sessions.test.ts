// Testes da expiração e da limpeza de sessões inativas do Social Media OS.
//
// O Convex Auth cria cada sessão com dois prazos: o total
// (`authSessions.expirationTime`, 30 dias) e o de inatividade
// (`authRefreshTokens.expirationTime`, empurrado a cada renovação). A
// biblioteca **recusa** a renovação depois do prazo — mas, se ninguém tentar
// renovar, a sessão e os tokens vencidos ficariam no banco para sempre. Quem
// varre isso é a função interna `sessions.cleanupInactiveSessions`, agendada no
// cron diário (`src/convex/crons.ts`). Aqui ela é exercitada direto, com as
// linhas de auth criadas à mão (sem passar pelo login).
//
// Rode com: bun test

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";

import { api, internal } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";

// Caminhos relativos a este arquivo; a entrada em `_generated` é o que permite
// ao harness descobrir a raiz do diretório de funções.
const modules = {
  "../src/convex/_generated/api.js": () =>
    import("../src/convex/_generated/api"),
  "../src/convex/auth.ts": () => import("../src/convex/auth"),
  "../src/convex/sessions.ts": () => import("../src/convex/sessions"),
};

const DAY = 24 * 60 * 60 * 1000;
const MONTH = 30 * DAY;

const realConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

beforeEach(() => {
  // O Convex Auth loga em INFO/ERROR a cada `auth:store`; silenciamos o ruído.
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
});

afterEach(() => {
  console.log = realConsole.log;
  console.info = realConsole.info;
  console.warn = realConsole.warn;
  console.error = realConsole.error;
});

/**
 * Uma conta com cinco sessões, uma para cada situação:
 *
 *  1. `active` — sessão e refresh vivos (não pode ser tocada);
 *  2. `expired` — a sessão passou do prazo total;
 *  3. `inactive` — sessão no prazo, mas o único refresh venceu (não renova);
 *  4. `refreshed` — sessão viva com um token antigo vencido e o atual vivo;
 *  5. `orphan` — token vivo cuja sessão já foi apagada.
 */
async function seededSessions() {
  const t = convexTest(schema, modules);

  const ids = await t.run(async (ctx) => {
    const now = Date.now();
    const user = await ctx.db.insert("users", { email: "gestora@exemplo.com" });

    const activeSession = await ctx.db.insert("authSessions", {
      userId: user,
      expirationTime: now + MONTH,
    });
    const activeToken = await ctx.db.insert("authRefreshTokens", {
      sessionId: activeSession,
      expirationTime: now + MONTH,
    });

    const expiredSession = await ctx.db.insert("authSessions", {
      userId: user,
      expirationTime: now - DAY,
    });
    const expiredSessionToken = await ctx.db.insert("authRefreshTokens", {
      sessionId: expiredSession,
      expirationTime: now + MONTH,
    });

    const inactiveSession = await ctx.db.insert("authSessions", {
      userId: user,
      expirationTime: now + MONTH,
    });
    const inactiveToken = await ctx.db.insert("authRefreshTokens", {
      sessionId: inactiveSession,
      expirationTime: now - DAY,
    });

    const refreshedSession = await ctx.db.insert("authSessions", {
      userId: user,
      expirationTime: now + MONTH,
    });
    const oldToken = await ctx.db.insert("authRefreshTokens", {
      sessionId: refreshedSession,
      expirationTime: now - DAY,
      firstUsedTime: now - DAY,
    });
    const currentToken = await ctx.db.insert("authRefreshTokens", {
      sessionId: refreshedSession,
      expirationTime: now + MONTH,
    });

    const orphanSession = await ctx.db.insert("authSessions", {
      userId: user,
      expirationTime: now + MONTH,
    });
    const orphanToken = await ctx.db.insert("authRefreshTokens", {
      sessionId: orphanSession,
      expirationTime: now + MONTH,
    });
    await ctx.db.delete(orphanSession);

    return {
      user,
      activeSession,
      activeToken,
      expiredSession,
      expiredSessionToken,
      inactiveSession,
      inactiveToken,
      refreshedSession,
      oldToken,
      currentToken,
      orphanToken,
    };
  });

  return { t, ids };
}

async function remaining(t: Awaited<ReturnType<typeof seededSessions>>["t"]) {
  return await t.run(async (ctx) => ({
    sessions: (await ctx.db.query("authSessions").collect()).map((row) => row._id),
    tokens: (await ctx.db.query("authRefreshTokens").collect()).map((row) => row._id),
  }));
}

describe("limpeza de sessões inativas", () => {
  test("apaga vencidas e inativas com seus refresh tokens, e preserva as ativas", async () => {
    const { t, ids } = await seededSessions();

    const result = await t.mutation(
      internal.sessions.cleanupInactiveSessions,
      {},
    );
    expect(result).toEqual({ sessions: 2, refreshTokens: 4 });

    const state = await remaining(t);
    // Sobraram a sessão ativa e a que renovou; as vencidas/inativas e a órfã saíram.
    expect(state.sessions.sort()).toEqual(
      [ids.activeSession, ids.refreshedSession].sort(),
    );
    // Do par com token antigo, o vencido saiu e o atual ficou.
    expect(state.tokens.sort()).toEqual([ids.activeToken, ids.currentToken].sort());
  });

  test("rodar a limpeza de novo não encontra nada para apagar", async () => {
    const { t } = await seededSessions();

    await t.mutation(internal.sessions.cleanupInactiveSessions, {});
    expect(
      await t.mutation(internal.sessions.cleanupInactiveSessions, {}),
    ).toEqual({ sessions: 0, refreshTokens: 0 });
  });

  test("sessão vencida não renova: o refresh é recusado e a sessão é descartada", async () => {
    const { t, ids } = await seededSessions();

    // Formato que o cliente envia na renovação: `refreshTokenId|sessionId`.
    const refreshToken = `${ids.expiredSessionToken}|${ids.expiredSession}`;
    expect(await t.action(api.auth.signIn, { refreshToken })).toEqual({
      tokens: null,
    });

    const gone = await t.run(async (ctx) => ({
      session: await ctx.db.get(ids.expiredSession),
      token: await ctx.db.get(ids.expiredSessionToken),
      activeSession: await ctx.db.get(ids.activeSession),
      activeToken: await ctx.db.get(ids.activeToken),
    }));
    expect(gone.session).toBeNull();
    expect(gone.token).toBeNull();
    // A sessão ativa de outro dispositivo continua intacta.
    expect(gone.activeSession).not.toBeNull();
    expect(gone.activeToken).not.toBeNull();
  });

  test("inatividade também encerra: refresh vencido não renova e limpa a sessão", async () => {
    const { t, ids } = await seededSessions();

    const refreshToken = `${ids.inactiveToken}|${ids.inactiveSession}`;
    expect(await t.action(api.auth.signIn, { refreshToken })).toEqual({
      tokens: null,
    });

    const gone = await t.run(async (ctx) => ({
      session: await ctx.db.get(ids.inactiveSession),
      token: await ctx.db.get(ids.inactiveToken),
      activeSession: await ctx.db.get(ids.activeSession),
      activeToken: await ctx.db.get(ids.activeToken),
    }));
    expect(gone.session).toBeNull();
    expect(gone.token).toBeNull();
    expect(gone.activeSession).not.toBeNull();
    expect(gone.activeToken).not.toBeNull();
  });
});
