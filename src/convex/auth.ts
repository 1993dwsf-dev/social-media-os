import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

// A server-only invitation code prevents unrestricted public registrations.
const invitedPassword = Password({
  profile(params) {
    const expected = process.env.SOCIAL_MEDIA_OS_SIGNUP_CODE;
    const supplied = typeof params.inviteCode === "string" ? params.inviteCode.trim() : "";
    if (params.flow === "signUp" && (!expected || supplied !== expected)) {
      throw new ConvexError("Cadastro restrito. Solicite seu código de acesso ao administrador.");
    }
    const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      throw new ConvexError("Informe um e-mail válido.");
    }
    return { email };
  },
  validatePasswordRequirements(password: string) {
    if (password.length < 12 || password.length > 128) {
      throw new ConvexError("A senha precisa ter de 12 a 128 caracteres.");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [invitedPassword],
});
