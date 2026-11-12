import { readFile } from "node:fs/promises";
import { businessDocsFromRaw } from "./lib/catalog-formats.mjs";
import {
  createMeiliAdminClient,
  getDataProfile,
  getIndexName,
  getMeiliIndexSettings,
  resolveDataPath,
  waitForMeiliTask,
} from "./lib/search-engine.mjs";

const BATCH_SIZE = 1500;
const forceReimport = process.argv.includes("--force");

async function main() {
  const indexName = getIndexName();
  const client = createMeiliAdminClient();
  const index = client.index(indexName);
  const profile = getDataProfile();
  const moviesPath = await resolveDataPath();
  const indexSettings = getMeiliIndexSettings(profile);

  console.log(`Engine: Meilisearch`);
  console.log(`Index: ${indexName}`);
  console.log(`Host: ${process.env.MEILISEARCH_HOST}`);

  console.log("Updating index settings…");
  const settingsTask = await index.updateSettings(indexSettings);
  await waitForMeiliTask(client, settingsTask.taskUid);
  console.log("Settings applied.");

  const stats = await index.getStats();
  if (stats.numberOfDocuments > 0 && !forceReimport) {
    console.log(
      `Index already has ${stats.numberOfDocuments.toLocaleString()} documents.`,
    );
    console.log("Skipping import. Run: npm run seed -- --force");
    return;
  }

  console.log(`Reading ${moviesPath}…`);
  const raw = await readFile(moviesPath, "utf8");
  let movies;
  if (profile === "catalog") {
    const { docs, format, rowCount } = businessDocsFromRaw(raw, moviesPath);
    if (docs.length === 0) {
      throw new Error(
        `No businesses in ${moviesPath}. Run: npm run catalog:sync`,
      );
    }
  const skipped = rowCount - docs.length;
  if (skipped > 0) {
      console.log(
        `Catalog ${format}: ${rowCount} rows → ${docs.length} businesses (${skipped} products/skipped)`,
      );
    }
    movies = docs;
  } else {
    movies = JSON.parse(raw);
    if (!Array.isArray(movies)) {
      throw new Error("Movies JSON must be an array");
    }
  }

  console.log(`Importing ${movies.length.toLocaleString()} documents…`);
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const task = await index.addDocuments(batch, { primaryKey: "id" });
    await waitForMeiliTask(client, task.taskUid);
    const done = Math.min(i + BATCH_SIZE, movies.length);
    console.log(`  ${done.toLocaleString()} / ${movies.length.toLocaleString()}`);
  }

  const finalStats = await index.getStats();
  console.log(
    `Done. ${finalStats.numberOfDocuments.toLocaleString()} documents indexed.`,
  );
  console.log("\nRun: npm run index:test");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
