import {
  createMeiliAdminClient,
  createOpenSearchClient,
  getEngine,
  getIndexName,
  getDataProfile,
  getMeiliIndexSettings,
  getOpenSearchMappings,
  printBanner,
  waitForMeiliTask,
} from "./lib/search-engine.mjs";

const recreate = process.argv.includes("--recreate");

async function createMeili(indexName) {
  const client = createMeiliAdminClient();
  console.log(`Host: ${process.env.MEILISEARCH_HOST}`);

  if (recreate) {
    try {
      console.log("Deleting existing Meilisearch index…");
      const task = await client.deleteIndex(indexName);
      await waitForMeiliTask(client, task.taskUid);
    } catch {
      /* index may not exist */
    }
  }

  console.log("Applying index settings (creates index if needed)…");
  const index = client.index(indexName);
  const task = await index.updateSettings(getMeiliIndexSettings(getDataProfile()));
  await waitForMeiliTask(client, task.taskUid);
  console.log("Meilisearch index ready.");
}

async function createOpenSearch(indexName) {
  const client = createOpenSearchClient();
  console.log(`Node: ${process.env.OPENSEARCH_URL}`);

  const exists = await client.indices.exists({ index: indexName });
  if (exists.body) {
    if (recreate) {
      console.log("Deleting existing OpenSearch index…");
      await client.indices.delete({ index: indexName });
    } else {
      console.log("Index already exists. Use --recreate to delete and recreate.");
      return;
    }
  }

  console.log("Creating OpenSearch index with mappings…");
  await client.indices.create({
    index: indexName,
    body: { mappings: getOpenSearchMappings(getDataProfile()) },
  });
  console.log("OpenSearch index created.");
}

async function main() {
  const engine = getEngine();
  const indexName = getIndexName();
  printBanner(engine, indexName);

  if (engine === "opensearch") {
    await createOpenSearch(indexName);
  } else {
    await createMeili(indexName);
  }

  console.log("\nNext: npm run seed        # import documents");
  console.log("      npm run index:test  # smoke-test search");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
