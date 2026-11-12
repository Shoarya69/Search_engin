import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const command = process.argv[2];
const extraArgs = process.argv.slice(3);

const SCRIPTS = {
  create: "index-create.mjs",
  delete: "index-delete.mjs",
  status: "index-status.mjs",
  test: "search-test.mjs",
};

if (!command || !SCRIPTS[command]) {
  console.log(`Usage: npm run index -- <command> [options]

Commands:
  create    Create / configure index (add --recreate to drop first)
  delete    Delete index (requires --force)
  status    Connection + document count + schema summary
  test      Run sample searches (browse, text, sort, filter)

Examples:
  npm run index:create
  npm run index:create -- --recreate
  npm run index:status
  npm run index:test
  npm run index:delete -- --force
  npm run index:reset
  npm run meili:reset          # Meilisearch only: delete → create → seed
  npm run meili:reindex        # same + rebuild JSON (catalog/movies)
`);
  process.exit(command ? 1 : 0);
}

const dir = dirname(fileURLToPath(import.meta.url));
const child = spawn(
  process.execPath,
  [join(dir, SCRIPTS[command]), ...extraArgs],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code) => process.exit(code ?? 0));
