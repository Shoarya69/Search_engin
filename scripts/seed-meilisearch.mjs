import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MeiliSearch } from "meilisearch";

const BATCH_SIZE = 1500;

const host = process.env.MEILISEARCH_HOST?.trim();
const apiKey = process.env.MEILISEARCH_MASTER_API_KEY?.trim();
const indexName = process.env.MEILISEARCH_INDEX_NAME?.trim() || "movies";
const moviesPath = resolve(
  process.cwd(),
  process.env.MOVIES_JSON_PATH?.trim() || "./movies.json",
);
const forceReimport = process.argv.includes("--force");

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing ${name}. Set it in .env (see .env.example).`);
    process.exit(1);
  }
}

requireEnv("MEILISEARCH_HOST", host);
requireEnv("MEILISEARCH_MASTER_API_KEY", apiKey);

const client = new MeiliSearch({ host, apiKey });
const index = client.index(indexName);

const indexSettings = {
  searchableAttributes: ["title", "overview", "genres"],
  filterableAttributes: ["genres"],
  sortableAttributes: ["release_date"],
  displayedAttributes: [
    "id",
    "title",
    "overview",
    "genres",
    "poster",
    "release_date",
  ],
};

async function waitForTask(taskUid) {
  const task = await client.waitForTask(taskUid, {
    timeOutMs: 600_000,
    intervalMs: 500,
  });
  if (task.status === "failed") {
    throw new Error(task.error?.message ?? "Meilisearch task failed");
  }
  return task;
}

async function main() {
  console.log(`Index: ${indexName}`);
  console.log(`Host: ${host}`);

  console.log("Updating index settings…");
  const settingsTask = await index.updateSettings(indexSettings);
  await waitForTask(settingsTask.taskUid);
  console.log("Settings applied.");

  const stats = await index.getStats();
  if (stats.numberOfDocuments > 0 && !forceReimport) {
    console.log(
      `Index already has ${stats.numberOfDocuments.toLocaleString()} documents.`,
    );
    console.log("Skipping import. Pass --force to re-import all movies.");
    return;
  }

  console.log(`Reading ${moviesPath}…`);
  const raw = await readFile(moviesPath, "utf8");
  const movies = JSON.parse(raw);
  if (!Array.isArray(movies)) {
    throw new Error("movies.json must be a JSON array");
  }

  console.log(`Importing ${movies.length.toLocaleString()} documents…`);
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const task = await index.addDocuments(batch, { primaryKey: "id" });
    await waitForTask(task.taskUid);
    const done = Math.min(i + BATCH_SIZE, movies.length);
    console.log(`  ${done.toLocaleString()} / ${movies.length.toLocaleString()}`);
  }

  const finalStats = await index.getStats();
  console.log(
    `Done. ${finalStats.numberOfDocuments.toLocaleString()} documents indexed.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
