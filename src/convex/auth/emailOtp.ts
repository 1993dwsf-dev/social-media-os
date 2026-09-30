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
        "https://auth.freebuff.app/send_otp",
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "um aplicativo freebuff.com",
        },
        {
          headers: {
            "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4",
          },
        },
      );
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
