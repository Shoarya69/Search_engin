/**
 * Delete Meilisearch index, recreate settings, re-import JSON from .env profile.
 *
 * Usage:
 *   npm run meili:reset
 *   npm run meili:reset -- --build   # catalog: run build:catalog first
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getDataProfile } from "./lib/search-engine.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(dir, "..");
const withBuild = process.argv.includes("--force-build") || process.argv.includes("--build");

const meiliEnv = {
  ...process.env,
  SEARCH_ENGINE: "meilisearch",
  VITE_SEARCH_ENGINE: "meilisearch",
};

function runNode(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(dir, script), ...args], {
      stdio: "inherit",
      env: meiliEnv,
      cwd: repoRoot,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} failed (exit ${code})`));
    });
  });
}

function runNpm(script) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      stdio: "inherit",
      env: meiliEnv,
      cwd: repoRoot,
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm run ${script} failed (exit ${code})`));
    });
  });
}

async function main() {
  const profile = getDataProfile();
  console.log(`Meilisearch full reset (profile: ${profile})\n`);

  if (withBuild) {
    if (profile === "catalog") {
      console.log("→ Rebuilding catalog JSON…\n");
      await runNpm("build:catalog");
    } else {
      console.log("→ Rebuilding movies JSON (IMDb enrich if TSVs present)…\n");
      await runNpm("build:movies");
    }
  }

  console.log("→ Deleting index…\n");
  await runNode("index-delete.mjs", ["--force"]);

  console.log("\n→ Creating index + settings…\n");
  await runNode("index-create.mjs");

  console.log("\n→ Importing documents…\n");
  await runNode("seed-meilisearch.mjs", ["--force"]);

  console.log("\n✓ Meilisearch index delete → create → seed done.");
  console.log("  npm run index:test   # smoke test");
  console.log("  npm run dev          # refresh UI");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
