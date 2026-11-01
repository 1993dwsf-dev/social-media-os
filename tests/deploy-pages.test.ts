import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixtures: string[] = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0))
    rmSync(fixture, { recursive: true, force: true });
});

// Execute the real build script against local command stubs. No deployment
// credentials, network connection or production mutation are used by this test.
function publication(
  options: { branch?: string; key?: string; fail?: string } = {},
) {
  const root = mkdtempSync(join(tmpdir(), "social-media-os-publication-"));
  fixtures.push(root);
  for (const directory of ["scripts", "bin", "node_modules/convex/bin"]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  const script = join(root, "scripts/build-pages.mjs");
  const log = join(root, "commands.log");
  copyFileSync(new URL("../scripts/build-pages.mjs", import.meta.url), script);
  const commandStub = `
const { appendFileSync } = require("node:fs");
const command = process.argv[1].endsWith("bun") ? "bun" : "convex";
const stage = command + " " + process.argv.slice(2).join(" ");
appendFileSync(process.env.SOCIAL_MEDIA_OS_TEST_COMMAND_LOG, stage + "\\n");
if (stage === process.env.SOCIAL_MEDIA_OS_TEST_FAIL_STAGE) process.exit(23);
`;
  writeFileSync(join(root, "node_modules/convex/bin/main.js"), commandStub);
  const bun = join(root, "bin/bun");
  writeFileSync(bun, `#!/usr/bin/env node\n${commandStub}`);
  chmodSync(bun, 0o700);
  writeFileSync(log, "");

  const result = spawnSync("node", [script], {
    cwd: root,
    encoding: "utf8",
    timeout: 10_000,
    env: {
      PATH: `${join(root, "bin")}:${process.env.PATH}`,
      CF_PAGES_BRANCH: options.branch ?? "main",
      CONVEX_DEPLOY_KEY:
        options.key ?? "prod:charming-leopard-770|test-only-not-a-real-secret",
      SOCIAL_MEDIA_OS_TEST_COMMAND_LOG: log,
      SOCIAL_MEDIA_OS_TEST_FAIL_STAGE: options.fail ?? "",
    },
  });
  if (result.error) throw result.error;
  return {
    ...result,
    commands: readFileSync(log, "utf8").trim().split("\n").filter(Boolean),
  };
}

describe("publicação exclusiva da main", () => {
  test("recusa outra branch antes de executar comandos", () => {
    const result = publication({ branch: "other-branch" });
    expect(result.status).not.toBe(0);
    expect(result.commands).toEqual([]);
  });

  test("recusa uma origem sem branch identificada", () => {
    const result = publication({ branch: "" });
    expect(result.status).not.toBe(0);
    expect(result.commands).toEqual([]);
  });

  test("recusa chave de outro backend sem revelar seu valor", () => {
    const key = "prod:another-project|dummy-private-value";
    const result = publication({ key });
    expect(result.status).not.toBe(0);
    expect(result.commands).toEqual([]);
    expect(result.stdout + result.stderr).not.toContain(key);
  });

  for (const stage of [
    "convex codegen --typecheck disable",
    "bun run audit",
    "bun run lint",
    "bun test",
    "bun run build",
  ]) {
    test(`falha em ${stage} impede a publicação do backend`, () => {
      const result = publication({ fail: stage });
      expect(result.status).toBe(23);
      expect(result.commands).toContain(stage);
      expect(
        result.commands.some((command) => command.startsWith("convex deploy")),
      ).toBe(false);
    });
  }

  test("só publica o backend após aprovação das verificações e do build", () => {
    const result = publication();
    expect(result.status).toBe(0);
    const deploy = result.commands.indexOf("convex deploy --yes");
    expect(deploy).toBeGreaterThan(-1);
    for (const check of [
      "convex codegen --typecheck disable",
      "bun run audit",
      "bun run lint",
      "bun test",
      "bun run build",
    ]) {
      expect(result.commands.indexOf(check)).toBeGreaterThan(-1);
      expect(result.commands.indexOf(check)).toBeLessThan(deploy);
    }
  });
});
