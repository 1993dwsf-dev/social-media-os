// Testes do anti-robô do /auth (Cloudflare Turnstile): normalização do
// identificador, validade das autorizações de envio e o comportamento do
// siteverify — incluindo a degradação graciosa quando as chaves não estão
// configuradas ou quando o Cloudflare fica inacessível.
//
// Rode com: bun test

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  TURNSTILE_GRANT_TTL_MS,
  isGrantActive,
  isTurnstileEnforced,
  normalizeTurnstileEmail,
  turnstileErrorMessage,
  verifyTurnstileToken,
} from "../src/lib/turnstile-server";

const realFetch = globalThis.fetch;
const realWarn = console.warn;
const realError = console.error;

let requested: { url: string; body: string; contentType: string | null }[] = [];

function mockFetch(
  handler: () => Response | Promise<Response> | never,
) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requested.push({
      url: String(input),
      body: String(init?.body ?? ""),
      contentType:
        new Headers(init?.headers as HeadersInit).get("content-type"),
    });
    return await handler();
  }) as typeof fetch;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  requested = [];
  console.warn = () => {};
  console.error = () => {};
  delete process.env.TURNSTILE_SECRET_KEY;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  console.warn = realWarn;
  console.error = realError;
  delete process.env.TURNSTILE_SECRET_KEY;
});

describe("normalizeTurnstileEmail", () => {
  test("apara espaços e ignora maiúsculas, como o e-mail digitado no form", () => {
    expect(normalizeTurnstileEmail("  Gestor@Agencia.COM ")).toBe(
      "gestor@agencia.com",
    );
    expect(normalizeTurnstileEmail("ja-normal@x.com")).toBe("ja-normal@x.com");
  });
});

describe("isGrantActive", () => {
  const now = 1_000_000;

  test("vale antes de expirar e enquanto não foi usada", () => {
    expect(isGrantActive({ expiresAt: now + 1 }, now)).toBe(true);
  });

  test("não vale depois de usada nem depois de expirar", () => {
    expect(isGrantActive({ expiresAt: now + 1, usedAt: now }, now)).toBe(false);
    expect(isGrantActive({ expiresAt: now - 1 }, now)).toBe(false);
  });

  test("a janela de autorização é curta (10 minutos)", () => {
    expect(TURNSTILE_GRANT_TTL_MS).toBe(10 * 60 * 1000);
  });
});

describe("turnstileErrorMessage", () => {
  test("explica o token expirado/reutilizado", () => {
    expect(turnstileErrorMessage(["timeout-or-duplicate"])).toContain(
      "expirou ou já foi usada",
    );
  });

  test("pede para resolver a verificação quando falta o token", () => {
    expect(turnstileErrorMessage(["missing-input-response"])).toContain(
      "Resolva a verificação de segurança",
    );
  });

  test("tem mensagem genérica para os demais códigos", () => {
    expect(turnstileErrorMessage(["invalid-input-secret"])).toContain(
      "Não foi possível validar a verificação de segurança",
    );
  });
});

describe("isTurnstileEnforced", () => {
  test("só exige captcha quando a chave secreta existe", () => {
    expect(isTurnstileEnforced()).toBe(false);
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    expect(isTurnstileEnforced()).toBe(true);
  });
});

describe("verifyTurnstileToken", () => {
  test("sem chave secreta, libera o acesso sem chamar o Cloudflare", async () => {
    mockFetch(() => jsonResponse({ success: false }));
    const result = await verifyTurnstileToken("qualquer-token");
    expect(result).toEqual({
      ok: true,
      skipped: true,
      unavailable: false,
      errorCodes: [],
    });
    expect(requested).toHaveLength(0);
  });

  test("com chave secreta, recusa token vazio antes de chamar o Cloudflare", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    mockFetch(() => jsonResponse({ success: true }));
    const result = await verifyTurnstileToken("");
    expect(result.ok).toBe(false);
    expect(result.errorCodes).toEqual(["missing-input-response"]);
    expect(requested).toHaveLength(0);
  });

  test("envia secret e token para o siteverify e aceita a resposta positiva", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    mockFetch(() => jsonResponse({ success: true }));
    const result = await verifyTurnstileToken("token-do-widget");

    expect(result).toEqual({
      ok: true,
      skipped: false,
      unavailable: false,
      errorCodes: [],
    });
    expect(requested[0].url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(requested[0].contentType).toBe("application/x-www-form-urlencoded");
    const body = new URLSearchParams(requested[0].body);
    expect(body.get("secret")).toBe("sempre-passa");
    expect(body.get("response")).toBe("token-do-widget");
  });

  test("propaga os códigos de erro quando o token é rejeitado", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    mockFetch(() =>
      jsonResponse({
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      }),
    );
    const result = await verifyTurnstileToken("token-repetido");
    expect(result.ok).toBe(false);
    expect(result.unavailable).toBe(false);
    expect(result.errorCodes).toEqual(["timeout-or-duplicate"]);
  });

  test("erro HTTP do Cloudflare não tranca o login (degrada aberto)", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    mockFetch(() => new Response("boom", { status: 500 }));
    const result = await verifyTurnstileToken("token-do-widget");
    expect(result.ok).toBe(true);
    expect(result.unavailable).toBe(true);
    expect(result.errorCodes).toEqual(["http-500"]);
  });

  test("falha de rede não tranca o login (degrada aberto)", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sempre-passa";
    mockFetch(() => {
      throw new Error("offline");
    });
    const result = await verifyTurnstileToken("token-do-widget");
    expect(result.ok).toBe(true);
    expect(result.unavailable).toBe(true);
    expect(result.errorCodes).toEqual(["verification-unavailable"]);
  });

  test("aceita as chaves de teste oficiais do Cloudflare", async () => {
    // Documentadas em /turnstile/troubleshooting/testing/ — a secreta sempre
    // passa e a que sempre bloqueia só muda a resposta do siteverify.
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    mockFetch(() => jsonResponse({ success: true }));
    const result = await verifyTurnstileToken("XXXX.DUMMY.TOKEN.XXXX");
    expect(result.ok).toBe(true);
  });
});
