import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// This project owns its production backend. Never accept another app's key.
const deployment = "charming-leopard-770";
const deployKey = process.env.CONVEX_DEPLOY_KEY ?? "";
if (!deployKey.startsWith(`prod:${deployment}|`)) {
  throw new Error(
    "Configure a deploy key exclusiva do Convex de produção do Social Media OS.",
  );
}
if (process.env.CF_PAGES_BRANCH !== "main") {
  throw new Error(
    "A publicação do Social Media OS é permitida somente pela main.",
  );
}

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = fileURLToPath(
  new URL("../node_modules/convex/bin/main.js", import.meta.url),
);
const env = {
  ...process.env,
  VITE_CONVEX_URL: `https://${deployment}.convex.cloud`,
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit" });
  if (result.error)
    throw new Error("Não foi possível iniciar uma etapa da publicação.");
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Codegen reads deployment metadata without changing the published backend.
// Validate this same checkout before either backend or frontend is published.
// Argument arrays avoid the Pages runner's handling of nested command quotes.
run(process.execPath, [cli, "codegen", "--typecheck", "disable"]);
run("bun", ["run", "audit"]);
run("bun", ["run", "lint"]);
run("bun", ["test"]);
run("bun", ["run", "build"]);
run(process.execPath, [cli, "deploy", "--yes"]);
