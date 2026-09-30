// Entrada como visitante ("Continuar como visitante") com o mesmo `id` do
// provider anônimo padrão do Convex Auth, mas exigindo o captcha quando o
// Cloudflare Turnstile está configurado.
//
// É um `ConvexCredentials` porque o `authorize` roda com o `ctx` da action (com
// `fetch`), diferente do provider anônimo padrão, cujo `profile` é síncrono e
// não daria para validar o token.

import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { createAccount } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import {
  isTurnstileEnforced,
  turnstileErrorMessage,
  verifyTurnstileToken,
} from "../../lib/turnstile-server";

export const guest = ConvexCredentials({
  id: "anonymous",
  authorize: async (params, ctx) => {
    if (isTurnstileEnforced()) {
      const token =
        typeof params.turnstileToken === "string" ? params.turnstileToken : "";
      const result = await verifyTurnstileToken(token);
      if (!result.ok) throw new ConvexError(turnstileErrorMessage(result.errorCodes));
    }

    // Mesmo comportamento do provider anônimo padrão: uma conta nova, sem
    // e-mail, marcada como anônima.
    const { user } = await createAccount(ctx, {
      provider: "anonymous",
      account: { id: crypto.randomUUID() },
      profile: { isAnonymous: true },
    });
    return { userId: user._id };
  },
});
