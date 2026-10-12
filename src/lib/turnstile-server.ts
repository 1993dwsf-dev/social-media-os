// Verificação server-side do Cloudflare Turnstile (anti-robô do /auth).
//
// Este módulo é importado pelas funções Convex — nunca pelo cliente, porque
// depende de `process.env` e do `fetch` do servidor.
//
// Regra de degradação: enquanto `TURNSTILE_SECRET_KEY` não estiver configurada
// (aba Keys), a verificação é ignorada e o login continua funcionando
// exatamente como antes. Assim que a chave existir, o captcha passa a ser
// exigido no envio do código por e-mail e na entrada como visitante.
//
// Exceção deliberada: quando a chave está configurada, falha de rede/HTTP
// bloqueia o login. Isso evita que a barreira antiabuso seja contornada
// justamente durante uma indisponibilidade; mantenha limites de tentativa e
// monitore o serviço.

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Quanto tempo uma autorização de envio fica válida (10 minutos). */
export const TURNSTILE_GRANT_TTL_MS = 10 * 60 * 1000;

export type TurnstileResult = {
  /** `true` quando pode seguir. Falso só quando o token foi realmente recusado. */
  ok: boolean;
  /** Chaves não configuradas: a checagem está desligada. */
  skipped: boolean;
  /** Cloudflare inacessível: a checagem não pôde ser concluída. */
  unavailable: boolean;
  /** Códigos devolvidos pelo Cloudflare (ex.: `timeout-or-duplicate`). */
  errorCodes: string[];
};

/** O captcha só é exigido quando a chave secreta está configurada. */
export function isTurnstileEnforced(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/** Normaliza o e-mail usado como identificador das autorizações de envio. */
export function normalizeTurnstileEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Uma autorização só vale uma vez e por tempo limitado. */
export function isGrantActive(
  grant: { expiresAt: number; usedAt?: number },
  now: number,
): boolean {
  return grant.usedAt === undefined && grant.expiresAt > now;
}

/** Mensagem em pt-BR apresentada ao usuário quando a verificação falha. */
export function turnstileErrorMessage(errorCodes: string[]): string {
  if (errorCodes.includes("timeout-or-duplicate")) {
    return "A verificação de segurança expirou ou já foi usada. Recarregue a página e tente novamente.";
  }
  if (errorCodes.includes("missing-input-response")) {
    return "Resolva a verificação de segurança antes de continuar.";
  }
  return "Não foi possível validar a verificação de segurança. Recarregue a página e tente novamente.";
}

/**
 * Valida um token do widget junto ao Cloudflare (`siteverify`).
 *
 * Tokens são de uso único: o Cloudflare recusa a segunda validação do mesmo
 * token (`timeout-or-duplicate`), o que já impede reaproveitamento.
 */
export async function verifyTurnstileToken(
  token: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.warn(
      "[turnstile] TURNSTILE_SECRET_KEY ausente — verificação anti-robô desativada.",
    );
    return { ok: true, skipped: true, unavailable: false, errorCodes: [] };
  }

  if (!token) {
    return {
      ok: false,
      skipped: false,
      unavailable: false,
      errorCodes: ["missing-input-response"],
    };
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });

    if (!response.ok) {
      console.error("[turnstile] siteverify respondeu HTTP", response.status);
      return {
        ok: false,
        skipped: false,
        unavailable: true,
        errorCodes: [`http-${response.status}`],
      };
    }

    const payload = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    return {
      ok: payload.success === true,
      skipped: false,
      unavailable: false,
      errorCodes: payload["error-codes"] ?? [],
    };
  } catch (error) {
    console.error("[turnstile] falha ao falar com o siteverify:", error);
    return {
      ok: false,
      skipped: false,
      unavailable: true,
      errorCodes: ["verification-unavailable"],
    };
  }
}
