import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import axios from "axios";
import { ConvexError } from "convex/values";

import {
  isTurnstileEnforced,
  normalizeTurnstileEmail,
} from "../../lib/turnstile-server";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutos
  // Esta função pode ser assíncrona
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest(
    { identifier: email, token },
    ...args: unknown[]
  ) {
    // O Convex Auth chama este provider com o `ctx` da action como segundo
    // argumento, mas o tipo público do provider de e-mail ainda não declara
    // isso (é o mesmo motivo do `@ts-expect-error` no próprio pacote).
    const ctx = args[0] as ActionCtx | undefined;

    // Anti-robô: o código só sai se o visitante resolveu o captcha na tela de
    // login (autorização gravada por `turnstile.grantEmailAccess`). Sem a
    // chave secreta configurada, nada disso é exigido.
    if (isTurnstileEnforced()) {
      const allowed = ctx
        ? await ctx.runMutation(internal.turnstile.consumeEmailGrant, {
            identifier: normalizeTurnstileEmail(email),
          })
        : false;
      if (!allowed) {
        throw new ConvexError(
          "Resolva a verificação de segurança antes de pedir o código.",
        );
      }
    }

    try {
      await axios.post(
        freebuffEmailOtpUrl(),
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "um aplicativo freebuff.com",
        },
        {
          headers: {
            ...freebuffEmailOtpHeaders(),
          },
        },
      );
    } catch (error) {
      throw freebuffEmailOtpError(error);
    }
  },
});

// Sign-in codes are sent by the Freebuff integrations gateway, which knows
// this project by its own key: VLY_INTEGRATION_KEY, a Convex environment
// variable set when the project was created. The email's wording is fixed by
// the gateway.
function freebuffEmailOtpUrl(): string {
  const base =
    process.env.VLY_INTEGRATION_BASE_URL || "https://integrations.vly.ai";
  return `${base.replace(/\/+$/, "")}/v1/email/otp`;
}

function freebuffEmailOtpHeaders(): Record<string, string> {
  const key = process.env.VLY_INTEGRATION_KEY;
  if (!key) {
    throw new Error(
      "VLY_INTEGRATION_KEY is not set on this Convex deployment, so email sign-in cannot send codes.",
    );
  }
  return { Authorization: `Bearer ${key}` };
}

// Never stringify the whole request error: it carries the request headers.
function freebuffEmailOtpError(error: unknown): Error {
  const response = (
    error as { response?: { status?: number; data?: { error?: unknown } } }
  )?.response;
  if (response) {
    const detail =
      typeof response.data?.error === "string" ? `: ${response.data.error}` : "";
    return new Error(
      `Could not send the sign-in code (HTTP ${response.status})${detail}`,
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Could not send the sign-in code: ${message}`);
}
