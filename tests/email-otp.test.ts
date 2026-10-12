// Testes do fluxo completo de login por e-mail com captcha do Contentplane.
//
// O caminho real do cliente é: resolver o widget → `turnstile.verifyTurnstile`
// (valida no Cloudflare e grava a autorização de 10 minutos para o e-mail) →
// `auth.signIn` com o provider `email-otp` (só envia o código se a autorização
// existir e a consome na hora) → `auth.signIn` com o código recebido, que cria
// a sessão.
//
// Aqui esse caminho é exercitado de ponta a ponta com o Convex em memória
// (`convex-test`): o siteverify do Cloudflare e o envio de e-mail (axios) são
// mockados — nenhuma chamada de rede sai do teste.
//
// Rode com: bun test

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";
import { convexTest } from "convex-test";

import { api } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";

// Caminhos relativos a este arquivo; `auth.ts` é onde o `signIn` roda.
const modules = {
  "../src/convex/_generated/api.js": () =>
    import("../src/convex/_generated/api"),
  "../src/convex/auth.ts": () => import("../src/convex/auth"),
  "../src/convex/portal.ts": () => import("../src/convex/portal"),
  "../src/convex/turnstile.ts": () => import("../src/convex/turnstile"),
  "../src/convex/users.ts": () => import("../src/convex/users"),
};

type TestConvex = ReturnType<typeof convexTest>;

const EMAIL = "gestora@exemplo.com";

const today = "2026-09-30";

// ---- mocks de rede ---------------------------------------------------------

/** Códigos que o "serviço de e-mail" receberia (nunca sai e-mail de verdade). */
const sentOtps: { to: string; otp: string; appName: string }[] = [];

mock.module("axios", () => ({
  default: {
    post: async (
      url: string,
      body: { to: string; otp: string; appName: string },
    ) => {
      if (url !== "https://integrations.vly.ai/v1/email/otp") {
        throw new Error(`URL inesperada no envio de OTP: ${url}`);
      }
      sentOtps.push(body);
      return { status: 200, data: {} };
    },
  },
}));

const realFetch = globalThis.fetch;

/** Dublê do `siteverify` do Cloudflare, registrando o que foi enviado. */
function mockCloudflare(handler: () => Response | Promise<Response> | never) {
  const requested: { url: string; body: URLSearchParams }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requested.push({
      url: String(input),
      body: new URLSearchParams(String(init?.body ?? "")),
    });
    return await handler();
  }) as typeof fetch;
  return requested;
}

function cloudflareSays(success: boolean, errorCodes: string[] = []) {
  return new Response(
    JSON.stringify({ success, "error-codes": errorCodes }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

// ---- chave de assinatura das sessões ---------------------------------------

// O `signIn` que conclui o login gera o JWT da sessão; a chave é efêmera e
// gerada em memória, sem nenhum segredo em fixture.
let testPrivateKeyPem = "";

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;

  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const base64 = Buffer.from(pkcs8).toString("base64");
  const lines = base64.match(/.{1,64}/g)?.join("\n") ?? base64;
  testPrivateKeyPem = `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----\n`;
});

afterAll(() => {
  testPrivateKeyPem = "";
});

const realConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

beforeEach(() => {
  sentOtps.length = 0;
  delete process.env.TURNSTILE_SECRET_KEY;
  process.env.JWT_PRIVATE_KEY = testPrivateKeyPem;
  process.env.CONVEX_SITE_URL = "https://contentplane.exemplo";
  process.env.SITE_URL = "https://contentplane.exemplo";
  // O gateway do Freebuff exige a chave de integração para enviar o código.
  process.env.VLY_INTEGRATION_KEY = "chave-de-teste";
  // O Convex Auth loga em INFO a cada `auth:store`; silenciamos o ruído.
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
});

afterEach(() => {
  globalThis.fetch = realFetch;
  sentOtps.length = 0;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.JWT_PRIVATE_KEY;
  delete process.env.CONVEX_SITE_URL;
  delete process.env.SITE_URL;
  delete process.env.VLY_INTEGRATION_KEY;
  console.log = realConsole.log;
  console.info = realConsole.info;
  console.warn = realConsole.warn;
  console.error = realConsole.error;
});

// ---- helpers ---------------------------------------------------------------

async function grantsFor(t: TestConvex, identifier: string) {
  return await t.run(async (ctx) =>
    ctx.db
      .query("turnstileGrants")
      .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
      .collect(),
  );
}

/** Captura e confere a recusa, seja `ConvexError` (`.data`) ou `Error` comum. */
async function expectRefusal(promise: Promise<unknown>, expected: string) {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, "a operação deveria ter sido recusada").toBeDefined();

  const data = (caught as { data?: unknown })?.data;
  const message =
    typeof data === "string"
      ? data
      : caught instanceof Error
        ? caught.message
        : String(caught);
  expect(message).toContain(expected);
}

/** Sessão atual da conta com este e-mail (cada login cria uma sessão nova). */
async function sessionOfEmail(t: TestConvex, email: string) {
  return await t.run(async (ctx) => {
    const user = (await ctx.db.query("users").collect()).find(
      (row) => row.email === email,
    );
    if (!user) return null;
    const session = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();
    return session ? { userId: user._id, sessionId: session._id } : null;
  });
}

/**
 * Roda o caminho até o código ter sido "enviado" e devolve o código em claro.
 * Pode ser chamado mais de uma vez (cada chamada pede um novo desafio).
 */
async function startedFlow(t: TestConvex) {
  process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
  mockCloudflare(() => cloudflareSays(true));

  const verify = await t.action(api.turnstile.verifyTurnstile, {
    email: EMAIL,
    token: "token-do-widget",
  });
  expect(verify).toEqual({ ok: true, message: "" });

  const before = sentOtps.length;
  const started = await t.action(api.auth.signIn, {
    provider: "email-otp",
    params: { email: EMAIL },
  });
  expect(started).toEqual({ started: true });
  expect(sentOtps).toHaveLength(before + 1);
  return sentOtps[before].otp;
}

// ---- 1. caminho feliz ------------------------------------------------------

describe("login por e-mail com captcha — caminho completo", () => {
  test("captcha libera o código, o código entra na conta e a sessão é isolada", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    const siteverify = mockCloudflare(() => cloudflareSays(true));

    const t = convexTest(schema, modules);

    // 1. O visitante resolve o widget; o token é validado no Cloudflare e a
    //    autorização é gravada para o e-mail normalizado.
    const verify = await t.action(api.turnstile.verifyTurnstile, {
      email: "  Gestora@Exemplo.COM ",
      token: "token-do-widget",
    });
    expect(verify).toEqual({ ok: true, message: "" });
    expect(siteverify).toHaveLength(1);
    expect(siteverify[0].url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(siteverify[0].body.get("response")).toBe("token-do-widget");

    const granted = await grantsFor(t, EMAIL);
    expect(granted).toHaveLength(1);
    expect(granted[0].token).toBe("token-do-widget");
    expect(granted[0].usedAt).toBeUndefined();
    expect(granted[0].expiresAt).toBeGreaterThan(Date.now());

    // 2. O login por e-mail só manda o código porque a autorização existe.
    const started = await t.action(api.auth.signIn, {
      provider: "email-otp",
      params: { email: EMAIL },
    });
    expect(started).toEqual({ started: true });

    expect(sentOtps).toHaveLength(1);
    expect(sentOtps[0].to).toBe(EMAIL);
    expect(sentOtps[0].otp).toMatch(/^\d{6}$/);

    // A autorização foi consumida: cada código custa um desafio resolvido.
    const consumed = await grantsFor(t, EMAIL);
    expect(consumed).toHaveLength(1);
    expect(typeof consumed[0].usedAt).toBe("number");

    // E o código nunca é gravado em claro no banco.
    const storedCode = await t.run(async (ctx) =>
      ctx.db.query("authVerificationCodes").collect(),
    );
    expect(storedCode).toHaveLength(1);
    expect(storedCode[0].code).toMatch(/^[0-9a-f]{64}$/);
    expect(storedCode[0].code).not.toBe(sentOtps[0].otp);

    // 3. Com o código recebido, o login conclui e devolve uma sessão de verdade.
    const signedIn = (await t.action(api.auth.signIn, {
      provider: "email-otp",
      params: { email: EMAIL, code: sentOtps[0].otp },
    })) as unknown as { tokens?: { token?: string } | null };
    expect(typeof signedIn.tokens?.token).toBe("string");
    expect(signedIn.tokens?.token?.length).toBeGreaterThan(0);

    // O código de uso único foi apagado ao ser verificado.
    const codesAfter = await t.run(async (ctx) =>
      ctx.db.query("authVerificationCodes").collect(),
    );
    expect(codesAfter).toEqual([]);

    // A sessão enxerga só a própria conta — que nasce vazia, como as demais.
    const session = await sessionOfEmail(t, EMAIL);
    expect(session).not.toBeNull();

    const asUser = t.withIdentity({
      subject: `${session!.userId}|${session!.sessionId}`,
    });
    expect(await asUser.query(api.auth.isAuthenticated)).toBe(true);
    expect((await asUser.query(api.users.currentUser))?.email).toBe(EMAIL);
    expect(await asUser.query(api.portal.listClients)).toEqual([]);
    expect(await asUser.query(api.portal.getWorkspace)).toBeNull();
  });
});

// ---- 2. verificação do código ----------------------------------------------

describe("login por e-mail com captcha — verificação do código", () => {
  test("código errado é recusado, não consome o código certo e não cria sessão", async () => {
    const t = convexTest(schema, modules);
    const otp = await startedFlow(t);
    const wrong = otp === "000000" ? "111111" : "000000";

    await expectRefusal(
      t.action(api.auth.signIn, {
        provider: "email-otp",
        params: { email: EMAIL, code: wrong },
      }),
      "Could not verify code",
    );

    const state = await t.run(async (ctx) => ({
      sessions: await ctx.db.query("authSessions").collect(),
      refreshTokens: await ctx.db.query("authRefreshTokens").collect(),
      codes: await ctx.db.query("authVerificationCodes").collect(),
      limits: await ctx.db.query("authRateLimits").collect(),
    }));
    expect(state.sessions).toEqual([]);
    expect(state.refreshTokens).toEqual([]);
    // O código correto continua válido — a tentativa errada não o consome.
    expect(state.codes).toHaveLength(1);
    // E a tentativa errada entra no contador de 10 por hora por e-mail.
    expect(state.limits).toHaveLength(1);
    expect(state.limits[0].attemptsLeft).toBe(9);
  });

  test("código expirado é recusado mesmo com o texto certo e não cria sessão", async () => {
    const t = convexTest(schema, modules);
    const otp = await startedFlow(t);

    // Expira o código de verdade na tabela (o provider usa 15 minutos).
    await t.run(async (ctx) => {
      const codes = await ctx.db.query("authVerificationCodes").collect();
      await ctx.db.patch(codes[0]._id, { expirationTime: Date.now() - 1 });
    });

    await expectRefusal(
      t.action(api.auth.signIn, {
        provider: "email-otp",
        params: { email: EMAIL, code: otp },
      }),
      "Could not verify code",
    );

    const state = await t.run(async (ctx) => ({
      sessions: await ctx.db.query("authSessions").collect(),
      refreshTokens: await ctx.db.query("authRefreshTokens").collect(),
      codes: await ctx.db.query("authVerificationCodes").collect(),
    }));
    expect(state.sessions).toEqual([]);
    expect(state.refreshTokens).toEqual([]);
    // O código expirado é descartado na tentativa: não dá para retentar.
    expect(state.codes).toEqual([]);
  });
});

// ---- 3. o captcha é obrigatório --------------------------------------------

describe("login por e-mail com captcha — sem autorização", () => {
  test("sem resolver o captcha, o código não sai e nenhuma sessão é criada", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";

    const t = convexTest(schema, modules);

    await expectRefusal(
      t.action(api.auth.signIn, {
        provider: "email-otp",
        params: { email: "sem-captcha@exemplo.com" },
      }),
      "Resolva a verificação de segurança antes de pedir o código.",
    );

    // Nada foi enviado, nenhuma sessão nasceu e nenhuma autorização apareceu.
    expect(sentOtps).toHaveLength(0);
    const state = await t.run(async (ctx) => ({
      sessions: await ctx.db.query("authSessions").collect(),
      grants: await ctx.db.query("turnstileGrants").collect(),
    }));
    expect(state.sessions).toEqual([]);
    expect(state.grants).toEqual([]);
  });

  test("cada código custa um desafio: reaproveitar a autorização é recusado", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    mockCloudflare(() => cloudflareSays(true));

    const t = convexTest(schema, modules);

    const verify = await t.action(api.turnstile.verifyTurnstile, {
      email: EMAIL,
      token: "token-do-widget",
    });
    expect(verify).toEqual({ ok: true, message: "" });

    await t.action(api.auth.signIn, {
      provider: "email-otp",
      params: { email: EMAIL },
    });
    expect(sentOtps).toHaveLength(1);

    // Sem um novo desafio, o segundo pedido de código é recusado.
    await expectRefusal(
      t.action(api.auth.signIn, {
        provider: "email-otp",
        params: { email: EMAIL },
      }),
      "Resolva a verificação de segurança antes de pedir o código.",
    );
    expect(sentOtps).toHaveLength(1);

    // A autorização usada foi limpa; não sobra nada reutilizável.
    expect(await grantsFor(t, EMAIL)).toEqual([]);
  });
});

// ---- 4. token recusado e Cloudflare fora do ar -----------------------------

describe("login por e-mail com captcha — token recusado e degradação", () => {
  test("token recusado pelo Cloudflare não grava autorização nem envia código", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-bloqueia";
    mockCloudflare(() => cloudflareSays(false, ["timeout-or-duplicate"]));

    const t = convexTest(schema, modules);

    const verify = await t.action(api.turnstile.verifyTurnstile, {
      email: EMAIL,
      token: "token-repetido",
    });
    expect(verify.ok).toBe(false);
    expect(verify.message).toContain("expirou ou já foi usada");

    expect(await grantsFor(t, EMAIL)).toEqual([]);

    // Sem autorização, o código também não sai.
    await expectRefusal(
      t.action(api.auth.signIn, {
        provider: "email-otp",
        params: { email: EMAIL },
      }),
      "Resolva a verificação de segurança antes de pedir o código.",
    );
    expect(sentOtps).toHaveLength(0);
  });

  test("Cloudflare inacessível bloqueia o login quando Turnstile está ativo", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    mockCloudflare(() => {
      throw new Error("offline");
    });

    const t = convexTest(schema, modules);

    // Política de falha fechada: sem resposta do siteverify, a checagem não
    // pode ser confirmada e o pedido é recusado — nada é autorizado.
    const verify = await t.action(api.turnstile.verifyTurnstile, {
      email: EMAIL,
      token: "token-do-widget",
    });
    expect(verify.ok).toBe(false);
    expect(verify.message).not.toBe("");
    expect(await grantsFor(t, EMAIL)).toHaveLength(0);

    // Sem autorizaedaccão, o código também não sai.
    await expectRefusal(
      t.action(api.auth.signIn, {
        provider: "email-otp",
        params: { email: EMAIL },
      }),
      "Resolva a verificação de segurança antes de pedir o código.",
    );
    expect(sentOtps).toHaveLength(0);
  });
});

// ---- 5. logout da sessão por e-mail ----------------------------------------

describe("logout da sessão por e-mail", () => {
  test("signOut encerra a sessão, mata o refresh e o espaço continua no próximo login", async () => {
    const t = convexTest(schema, modules);

    // Login completo: captcha → código → sessão.
    const otp = await startedFlow(t);
    const signedIn = (await t.action(api.auth.signIn, {
      provider: "email-otp",
      params: { email: EMAIL, code: otp },
    })) as unknown as {
      tokens?: { token?: string; refreshToken?: string } | null;
    };
    const refreshToken = signedIn.tokens?.refreshToken ?? "";
    expect(refreshToken.length).toBeGreaterThan(0);

    const session = await sessionOfEmail(t, EMAIL);
    expect(session).not.toBeNull();
    const asUser = t.withIdentity({
      subject: `${session!.userId}|${session!.sessionId}`,
    });

    // A sessão cria um cliente no próprio espaço.
    await asUser.mutation(api.portal.createClient, {
      data: {
        name: "Cliente da gestora",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        industry: "",
        packageName: "",
        monthlyFee: 0,
        startDate: today,
        status: "Active",
        socials: {},
        notes: "",
        onboarding: {},
        strategy: [],
        kpis: [],
      },
    });
    expect((await asUser.query(api.portal.listClients)).map((row) => row.name)).toEqual([
      "Cliente da gestora",
    ]);

    // Logout: a sessão e os tokens de refresh saem do banco.
    expect(await asUser.action(api.auth.signOut, {})).toBeNull();

    const afterLogout = await t.run(async (ctx) => ({
      sessions: await ctx.db.query("authSessions").collect(),
      refreshTokens: await ctx.db.query("authRefreshTokens").collect(),
      clients: await ctx.db.query("clients").collect(),
    }));
    expect(afterLogout.sessions).toEqual([]);
    expect(afterLogout.refreshTokens).toEqual([]);
    // O espaço continua no banco: o logout não apaga dados.
    expect(afterLogout.clients.map((row) => row.name)).toEqual(["Cliente da gestora"]);

    // O refresh token antigo não ressuscita a sessão...
    expect(await t.action(api.auth.signIn, { refreshToken })).toEqual({
      tokens: null,
    });

    // ...e o cliente deslogado não lê nem escreve.
    expect(await t.query(api.portal.listClients)).toEqual([]);
    expect(await t.query(api.portal.getWorkspace)).toBeNull();
    await expectRefusal(
      t.mutation(api.portal.createClient, { data: { name: "Invasor" } }),
      "Não autenticado",
    );

    // Entrando de novo com o mesmo e-mail, o espaço está lá.
    const otp2 = await startedFlow(t);
    const again = (await t.action(api.auth.signIn, {
      provider: "email-otp",
      params: { email: EMAIL, code: otp2 },
    })) as unknown as { tokens?: { token?: string } | null };
    expect(typeof again.tokens?.token).toBe("string");

    const relogin = await sessionOfEmail(t, EMAIL);
    expect(relogin).not.toBeNull();
    const asUserAgain = t.withIdentity({
      subject: `${relogin!.userId}|${relogin!.sessionId}`,
    });
    expect((await asUserAgain.query(api.portal.listClients)).map((row) => row.name)).toEqual([
      "Cliente da gestora",
    ]);
    expect(await t.run(async (ctx) => ctx.db.query("authSessions").collect())).toHaveLength(1);
  });
});
