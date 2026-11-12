import {
  createMeiliSearchClient,
  createOpenSearchClient,
  getDataProfile,
  getEngine,
  getIndexName,
  printBanner,
} from "./lib/search-engine.mjs";

const MOVIE_TESTS = [
  {
    name: "Empty query (browse)",
    runMeili: (index) => index.search("", { limit: 3 }),
    runOs: (client, indexName) =>
      client.search({
        index: indexName,
        body: { size: 3, query: { match_all: {} } },
      }),
    pickMeili: (r) => r.hits.map((h) => h.title),
    pickOs: (r) => r.body.hits.hits.map((h) => h._source.title),
  },
  {
    name: 'Text search "star wars"',
    runMeili: (index) => index.search("star wars", { limit: 3 }),
    runOs: (client, indexName) =>
      client.search({
        index: indexName,
        body: {
          size: 3,
          query: {
            multi_match: {
              query: "star wars",
              fields: ["title^3", "overview"],
            },
          },
        },
      }),
    pickMeili: (r) => r.hits.map((h) => h.title),
    pickOs: (r) => r.body.hits.hits.map((h) => h._source.title),
  },
];

const CATALOG_TESTS = [
  {
    name: "Browse all businesses",
    runMeili: (index) => index.search("", { limit: 3 }),
    runOs: (client, indexName) =>
      client.search({
        index: indexName,
        body: { size: 3, query: { match_all: {} } },
      }),
    pickMeili: (r) => r.hits.map((h) => h.name),
    pickOs: (r) => r.body.hits.hits.map((h) => h._source.name),
  },
  {
    name: 'Text search "laptop Jodhpur"',
    runMeili: (index) => index.search("laptop Jodhpur", { limit: 3 }),
    runOs: (client, indexName) =>
      client.search({
        index: indexName,
        body: {
          size: 3,
          query: {
            multi_match: {
              query: "laptop Jodhpur",
              fields: ["name^3", "search_text", "city"],
            },
          },
        },
      }),
    pickMeili: (r) => r.hits.map((h) => `${h.name} (${h.city ?? "?"})`),
    pickOs: (r) =>
      r.body.hits.hits.map(
        (h) => `${h._source.name} (${h._source.city ?? "?"})`,
      ),
  },
  {
    name: 'Filter city = "Jodhpur"',
    runMeili: (index) =>
      index.search("", { limit: 3, filter: ['city = "Jodhpur"'] }),
    runOs: (client, indexName) =>
      client.search({
        index: indexName,
        body: {
          size: 3,
          query: {
            bool: {
              must: [{ match_all: {} }],
              filter: [{ term: { city: "Jodhpur" } }],
            },
          },
        },
      }),
    pickMeili: (r) => r.hits.map((h) => h.name),
    pickOs: (r) => r.body.hits.hits.map((h) => h._source.name),
  },
];

async function main() {
  const engine = getEngine();
  const indexName = getIndexName();
  const profile = getDataProfile();
  const TESTS = profile === "catalog" ? CATALOG_TESTS : MOVIE_TESTS;

  printBanner(engine, indexName);
  console.log(`Profile: ${profile}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    process.stdout.write(`• ${test.name} … `);
    try {
      let titles;
      if (engine === "opensearch") {
        const client = createOpenSearchClient();
        const res = await test.runOs(client, indexName);
        titles = test.pickOs(res);
      } else {
        const client = createMeiliSearchClient();
        const index = client.index(indexName);
        const res = await test.runMeili(index);
        titles = test.pickMeili(res);
      }

      if (!titles.length) {
        console.log("FAIL (0 hits)");
        failed += 1;
        continue;
      }

      console.log("OK");
      for (const t of titles) {
        console.log(`    - ${t}`);
      }
      passed += 1;
    } catch (err) {
      console.log("FAIL");
      console.log(`    ${err.message ?? err}`);
      failed += 1;
    }
  }

  console.log(`\n${passed}/${TESTS.length} tests passed.`);
  if (failed > 0) {
    console.log("\nIf API key invalid: set VITE_MEILISEARCH_SEARCH_API_KEY = MEILISEARCH_MASTER_API_KEY for local dev.");
    console.log("If index is empty: npm run index:create && npm run seed -- --force");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
