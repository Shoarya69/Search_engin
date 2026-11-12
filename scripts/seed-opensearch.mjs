import { readFile } from "node:fs/promises";
import {
  createOpenSearchClient,
  getDataProfile,
  getIndexName,
  getOpenSearchMappings,
  resolveDataPath,
} from "./lib/search-engine.mjs";

const BATCH_SIZE = 500;
const forceReimport = process.argv.includes("--force");

async function ensureIndex(client, indexName, mappings) {
  const exists = await client.indices.exists({ index: indexName });
  if (exists.body) {
    if (forceReimport) {
      console.log(`Deleting index ${indexName}…`);
      await client.indices.delete({ index: indexName });
    } else {
      const count = await client.count({ index: indexName });
      if (count.body.count > 0) {
        console.log(
          `Index already has ${count.body.count.toLocaleString()} documents.`,
        );
        console.log("Skipping import. Pass --force to recreate and re-import.");
        return false;
      }
    }
  }

  console.log(`Creating index ${indexName}…`);
  await client.indices.create({
    index: indexName,
    body: { mappings },
  });
  return true;
}

async function bulkIndex(client, indexName, movies) {
  console.log(`Importing ${movies.length.toLocaleString()} documents…`);
  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const body = batch.flatMap((doc) => [
      { index: { _index: indexName, _id: String(doc.id) } },
      doc,
    ]);
    const result = await client.bulk({ refresh: false, body });
    if (result.body.errors) {
      const first = result.body.items?.find((item) => item.index?.error);
      throw new Error(first?.index?.error?.reason ?? "Bulk index failed");
    }
    const done = Math.min(i + BATCH_SIZE, movies.length);
    console.log(`  ${done.toLocaleString()} / ${movies.length.toLocaleString()}`);
  }
  await client.indices.refresh({ index: indexName });
}

async function main() {
  const indexName = getIndexName();
  const client = createOpenSearchClient();
  const mappings = getOpenSearchMappings(getDataProfile());
  const moviesPath = await resolveDataPath();

  console.log(`Engine: OpenSearch`);
  console.log(`Index: ${indexName}`);
  console.log(`Node: ${process.env.OPENSEARCH_URL}`);

  const shouldImport = await ensureIndex(client, indexName, mappings);
  if (!shouldImport) return;

  console.log(`Reading ${moviesPath}…`);
  const movies = JSON.parse(await readFile(moviesPath, "utf8"));
  if (!Array.isArray(movies)) {
    throw new Error("Movies JSON must be an array");
  }

  await bulkIndex(client, indexName, movies);
  const count = await client.count({ index: indexName });
  console.log(
    `Done. ${count.body.count.toLocaleString()} documents indexed in OpenSearch.`,
  );
  console.log("\nRun: npm run index:test");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
