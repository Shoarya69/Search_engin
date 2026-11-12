import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const engine = (
  process.env.SEARCH_ENGINE ||
  process.env.VITE_SEARCH_ENGINE ||
  "meilisearch"
)
  .trim()
  .toLowerCase();

const script =
  engine === "opensearch"
    ? "seed-opensearch.mjs"
    : "seed-meilisearch.mjs";

const dir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const child = spawn(process.execPath, [join(dir, script), ...args], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
