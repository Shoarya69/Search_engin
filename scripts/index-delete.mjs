import {
  createMeiliAdminClient,
  createOpenSearchClient,
  getEngine,
  getIndexName,
  printBanner,
  waitForMeiliTask,
} from "./lib/search-engine.mjs";

const force = process.argv.includes("--force");

async function main() {
  const engine = getEngine();
  const indexName = getIndexName();
  printBanner(engine, indexName);

  if (!force) {
    console.error("\nRefusing to delete without --force");
    console.error(`Run: npm run index:delete -- --force`);
    process.exit(1);
  }

  if (engine === "opensearch") {
    const client = createOpenSearchClient();
    const exists = await client.indices.exists({ index: indexName });
    if (!exists.body) {
      console.log("Index does not exist.");
      return;
    }
    await client.indices.delete({ index: indexName });
    console.log("OpenSearch index deleted.");
    return;
  }

  const client = createMeiliAdminClient();
  try {
    const task = await client.deleteIndex(indexName);
    await waitForMeiliTask(client, task.taskUid);
    console.log("Meilisearch index deleted.");
  } catch (err) {
    console.log("Index may not exist:", err.message ?? err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
