export const LEGAL_VERSION = "2026-11-01-minuta";

export function normalizedEmail(value: unknown): string {
  const email =
    typeof value === "string"
      ? value.normalize("NFKC").trim().toLowerCase()
      : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Informe um e-mail válido.");
  return email;
}

export function validatePassword(
  password: unknown,
): asserts password is string {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error("A senha precisa ter de 12 a 128 caracteres.");
  }
}

export function randomAccessCode(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function codeDigest(code: string): Promise<string> {
  if (!/^[a-f0-9]{64}$/.test(code))
    throw new Error("Código inválido ou expirado.");
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code),
  );
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
