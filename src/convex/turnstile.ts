// Anti-robô do /auth com Cloudflare Turnstile.
//
// O fluxo tem duas etapas porque o Convex Auth não repassa parâmetros extras do
// `signIn` para o provider de e-mail:
//
//   1. o cliente resolve o widget e chama a action pública `verifyTurnstile`,
//      que valida o token no Cloudflare e grava uma autorização de curta
//      duração para o e-mail informado;
//   2. o `signIn("email-otp")` só envia o código se aquela autorização existir
//      (e ela é consumida na hora — ver `src/convex/auth/emailOtp.ts`).
//
// Sem `TURNSTILE_SECRET_KEY` configurada nada disso é exigido: a action devolve
// sucesso sem gravar autorização e o envio do código segue como antes.

import { v } from "convex/values";

import {
  TURNSTILE_GRANT_TTL_MS,
  isGrantActive,
  isTurnstileEnforced,
  normalizeTurnstileEmail,
  turnstileErrorMessage,
  verifyTurnstileToken,
} from "../lib/turnstile-server";
import { internal } from "./_generated/api";
import { action, internalMutation, query } from "./_generated/server";

/**
 * Informa ao cliente se o captcha está ativo no servidor, para a tela de login
 * avisar quando o site key do widget ainda não foi configurado.
 */
export const getTurnstileStatus = query({
  args: {},
  handler: () => ({ enforced: isTurnstileEnforced() }),
});

/**
 * Valida o token do widget e libera o envio do código para este e-mail.
 * Devolve `{ ok: false, message }` em vez de lançar, para o cliente exibir uma
 * mensagem amigável em pt-BR.
 */
export const verifyTurnstile = action({
  args: { email: v.string(), token: v.string() },
  handler: async (ctx, { email, token }) => {
    const result = await verifyTurnstileToken(token);

    if (!result.ok) {
      return { ok: false, message: turnstileErrorMessage(result.errorCodes) };
    }

    // Sem chaves configuradas (ou com o Cloudflare fora do ar) não há
    // autorização a gravar: a checagem não existe deste lado.
    if (result.skipped) return { ok: true, message: "" };

    await ctx.runMutation(internal.turnstile.grantEmailAccess, {
      identifier: normalizeTurnstileEmail(email),
      token,
    });
    return { ok: true, message: "" };
  },
});

/** Grava (substituindo as anteriores) a autorização de envio do e-mail. */
export const grantEmailAccess = internalMutation({
  args: { identifier: v.string(), token: v.string() },
  handler: async (ctx, { identifier, token }) => {
    const now = Date.now();
    const previous = await ctx.db
      .query("turnstileGrants")
      .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
      .collect();
    for (const row of previous) await ctx.db.delete(row._id);

    await ctx.db.insert("turnstileGrants", {
      identifier,
      token,
      createdAt: now,
      expiresAt: now + TURNSTILE_GRANT_TTL_MS,
    });
    return null;
  },
});

/**
 * Consome a autorização do e-mail: devolve `true` quando havia uma válida e a
 * marca como usada, `false` quando o e-mail não passou pelo captcha. Aproveita
 * a passagem para limpar autorizações usadas/expiradas.
 */
export const consumeEmailGrant = internalMutation({
  args: { identifier: v.string() },
  handler: async (ctx, { identifier }) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("turnstileGrants")
      .withIndex("by_identifier", (q) => q.eq("identifier", identifier))
      .collect();

    const grant = rows.find((row) => isGrantActive(row, now));
    for (const row of rows) {
      if (row._id !== grant?._id) await ctx.db.delete(row._id);
    }
    if (!grant) return false;

    await ctx.db.patch(grant._id, { usedAt: now });
    return true;
  },
});
