// Regression tests for the MVP's only supported login mechanism.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";
import { api } from "../src/convex/_generated/api";
import schema from "../src/convex/schema";

const modules = {
  "../src/convex/_generated/api.js": () => import("../src/convex/_generated/api"),
  "../src/convex/auth.ts": () => import("../src/convex/auth"),
  "../src/convex/portal.ts": () => import("../src/convex/portal"),
  "../src/convex/users.ts": () => import("../src/convex/users"),
};

const email = "gestor@example.com";
const password = "Strong-Test-Password-2026!";
const inviteCode = "test-private-invitation";
let testPrivateKeyPem = "";

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const bytes = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const base64 = Buffer.from(bytes).toString("base64");
  const lines = base64.match(/.{1,64}/g)?.join("\n") ?? base64;
  testPrivateKeyPem = `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----\n`;
});
afterAll(() => { testPrivateKeyPem = ""; });
beforeEach(() => {
  process.env.JWT_PRIVATE_KEY = testPrivateKeyPem;
  process.env.CONVEX_SITE_URL = "https://social-media-os.example.com";
  process.env.SITE_URL = "https://social-media-os.example.com";
  process.env.SOCIAL_MEDIA_OS_SIGNUP_CODE = inviteCode;
});
afterEach(() => {
  delete process.env.JWT_PRIVATE_KEY;
  delete process.env.CONVEX_SITE_URL;
  delete process.env.SITE_URL;
  delete process.env.SOCIAL_MEDIA_OS_SIGNUP_CODE;
});

async function signIn(t: ReturnType<typeof convexTest>, flow: "signUp" | "signIn", extra: Record<string, string> = {}) {
  return t.action(api.auth.signIn, {
    provider: "password",
    params: { email, password, flow, ...extra },
  });
}

describe("password access — single deployment MVP", () => {
  test("signup without invitation is rejected and doesn't create a user", async () => {
    const t = convexTest(schema, modules);
    await expect(signIn(t, "signUp")).rejects.toThrow();
    expect(await t.run(async (ctx) => ctx.db.query("users").collect())).toHaveLength(0);
  });

  test("signup with wrong invitation is rejected", async () => {
    const t = convexTest(schema, modules);
    await expect(signIn(t, "signUp", { inviteCode: "wrong-code" })).rejects.toThrow();
    expect(await t.run(async (ctx) => ctx.db.query("users").collect())).toHaveLength(0);
  });

  test("weak signup password is rejected", async () => {
    const t = convexTest(schema, modules);
    await expect(signIn(t, "signUp", { inviteCode, password: "weak" })).rejects.toThrow();
    expect(await t.run(async (ctx) => ctx.db.query("users").collect())).toHaveLength(0);
  });

  test("valid invitation creates account; subsequent login does not require invitation", async () => {
    const t = convexTest(schema, modules);
    const created = await signIn(t, "signUp", { inviteCode });
    expect(created).toBeTruthy();
    const users = await t.run(async (ctx) => ctx.db.query("users").collect());
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe(email);

    const signedIn = await signIn(t, "signIn");
    expect(signedIn).toBeTruthy();
    expect(await t.run(async (ctx) => ctx.db.query("users").collect())).toHaveLength(1);
  });

  test("wrong password is refused", async () => {
    const t = convexTest(schema, modules);
    await signIn(t, "signUp", { inviteCode });
    await expect(signIn(t, "signIn", { password: "Wrong-Password-2026!" })).rejects.toThrow();
  });

  test("removed anonymous and email OTP providers cannot sign in", async () => {
    const t = convexTest(schema, modules);
    for (const provider of ["anonymous", "email-otp"]) {
      await expect(t.action(api.auth.signIn, { provider, params: { email } })).rejects.toThrow();
    }
    expect(await t.run(async (ctx) => ctx.db.query("users").collect())).toHaveLength(0);
  });
});
