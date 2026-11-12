import {
  createMeiliAdminClient,
  createOpenSearchClient,
  getEngine,
  getIndexName,
  printBanner,
} from "./lib/search-engine.mjs";

async function statusMeili(indexName) {
  const client = createMeiliAdminClient();
  console.log(`Host: ${process.env.MEILISEARCH_HOST}`);

  try {
    const health = await client.health();
    console.log(`Health: ${health.status}`);
  } catch (err) {
    console.error("Cannot reach Meilisearch:", err.message ?? err);
    process.exit(1);
  }

  try {
    const stats = await client.index(indexName).getStats();
    console.log(`Documents: ${stats.numberOfDocuments.toLocaleString()}`);
    console.log(`Indexing: ${stats.isIndexing ? "yes" : "no"}`);
  } catch {
    console.log("Index not found yet. Run: npm run index:create");
    return;
  }

  const settings = await client.index(indexName).getSettings();
  console.log("\nFilterable:", settings.filterableAttributes?.join(", ") ?? "—");
  console.log("Sortable:", settings.sortableAttributes?.join(", ") ?? "—");
}

async function statusOpenSearch(indexName) {
  const client = createOpenSearchClient();
  console.log(`Node: ${process.env.OPENSEARCH_URL}`);

  try {
    const info = await client.info();
    console.log(`Cluster: ${info.body.version?.number ?? "unknown"}`);
  } catch (err) {
    console.error("Cannot reach OpenSearch:", err.message ?? err);
    process.exit(1);
  }

  const exists = await client.indices.exists({ index: indexName });
  if (!exists.body) {
    console.log("Index not found. Run: npm run index:create");
    return;
  }

  const count = await client.count({ index: indexName });
  console.log(`Documents: ${count.body.count.toLocaleString()}`);

  const mapping = await client.indices.getMapping({ index: indexName });
  const props = Object.keys(
    mapping.body[indexName]?.mappings?.properties ?? {},
  );
  console.log("\nMapped fields:", props.join(", ") || "—");
}

async function main() {
  const engine = getEngine();
  const indexName = getIndexName();
  printBanner(engine, indexName);
  console.log("");

  if (engine === "opensearch") {
    await statusOpenSearch(indexName);
  } else {
    await statusMeili(indexName);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
