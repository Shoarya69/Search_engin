import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "@opensearch-project/opensearch";
import { MeiliSearch } from "meilisearch";

export function getEngine() {
  return (
    process.env.SEARCH_ENGINE ||
    process.env.VITE_SEARCH_ENGINE ||
    "meilisearch"
  )
    .trim()
    .toLowerCase();
}

export function getIndexName() {
  return (
    process.env.SEARCH_INDEX_NAME?.trim() ||
    process.env.VITE_SEARCH_INDEX_NAME?.trim() ||
    process.env.MEILISEARCH_INDEX_NAME?.trim() ||
    process.env.OPENSEARCH_INDEX?.trim() ||
    process.env.VITE_MEILISEARCH_INDEX_NAME?.trim() ||
    process.env.VITE_OPENSEARCH_INDEX?.trim() ||
    "movies"
  );
}

export const MEILI_INDEX_SETTINGS = {
  searchableAttributes: ["title", "overview", "genres"],
  filterableAttributes: ["genres", "origin_regions", "languages"],
  sortableAttributes: ["release_date", "vote_average", "num_votes"],
  rankingRules: [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
  ],
  displayedAttributes: [
    "id",
    "title",
    "overview",
    "genres",
    "poster",
    "release_date",
    "imdb_id",
    "vote_average",
    "num_votes",
    "origin_regions",
    "languages",
  ],
};

export function getDataProfile() {
  const raw =
    process.env.DATA_PROFILE?.trim() ||
    process.env.VITE_DATA_PROFILE?.trim() ||
    "movies";
  return raw.toLowerCase() === "catalog" ? "catalog" : "movies";
}

export const MEILI_CATALOG_SETTINGS = {
  searchableAttributes: [
    "name",
    "search_text",
    "category_labels",
    "business_type",
    "city",
    "state",
  ],
  filterableAttributes: [
    "city",
    "state",
    "category_labels",
    "business_type",
    "is_live",
  ],
  sortableAttributes: ["name"],
  displayedAttributes: [
    "id",
    "name",
    "slug",
    "city",
    "state",
    "country",
    "business_type",
    "category_labels",
    "search_text",
    "is_live",
    "pincode",
  ],
};

export const OPENSEARCH_CATALOG_MAPPINGS = {
  properties: {
    id: { type: "keyword" },
    name: { type: "text" },
    slug: { type: "keyword" },
    city: { type: "keyword" },
    state: { type: "keyword" },
    country: { type: "keyword" },
    business_type: { type: "keyword" },
    category_labels: { type: "keyword" },
    search_text: { type: "text" },
    is_live: { type: "boolean" },
    pincode: { type: "keyword" },
  },
};

export function getMeiliIndexSettings(profile = getDataProfile()) {
  return profile === "catalog" ? MEILI_CATALOG_SETTINGS : MEILI_INDEX_SETTINGS;
}

export function getOpenSearchMappings(profile = getDataProfile()) {
  return profile === "catalog" ? OPENSEARCH_CATALOG_MAPPINGS : OPENSEARCH_MAPPINGS;
}

export const OPENSEARCH_MAPPINGS = {
  properties: {
    id: { type: "integer" },
    title: { type: "text" },
    overview: { type: "text" },
    genres: { type: "keyword" },
    poster: { type: "keyword", index: false },
    release_date: { type: "long" },
    imdb_id: { type: "keyword" },
    vote_average: { type: "float" },
    num_votes: { type: "integer" },
    origin_regions: { type: "keyword" },
    languages: { type: "keyword" },
  },
};

export function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing ${name}. Set it in .env (see .env.example).`);
    process.exit(1);
  }
}

export function createMeiliAdminClient() {
  const host = process.env.MEILISEARCH_HOST?.trim();
  const apiKey = process.env.MEILISEARCH_MASTER_API_KEY?.trim();
  requireEnv("MEILISEARCH_HOST", host);
  requireEnv("MEILISEARCH_MASTER_API_KEY", apiKey);
  return new MeiliSearch({ host, apiKey });
}

export function createMeiliSearchClient() {
  const host =
    process.env.MEILISEARCH_HOST?.trim() ||
    process.env.VITE_MEILISEARCH_HOST?.trim();
  const apiKey =
    process.env.MEILISEARCH_SEARCH_API_KEY?.trim() ||
    process.env.VITE_MEILISEARCH_SEARCH_API_KEY?.trim() ||
    process.env.MEILISEARCH_MASTER_API_KEY?.trim();
  requireEnv("MEILISEARCH_HOST or VITE_MEILISEARCH_HOST", host);
  requireEnv(
    "MEILISEARCH_SEARCH_API_KEY or VITE_MEILISEARCH_SEARCH_API_KEY",
    apiKey,
  );
  return new MeiliSearch({ host, apiKey });
}

export function createOpenSearchClient() {
  const node = process.env.OPENSEARCH_URL?.trim();
  requireEnv("OPENSEARCH_URL", node);
  const username = process.env.OPENSEARCH_USERNAME?.trim();
  const password = process.env.OPENSEARCH_PASSWORD?.trim();
  const auth = username && password ? { username, password } : undefined;
  const insecure = process.env.OPENSEARCH_INSECURE === "true";
  return new Client({
    node,
    auth,
    ssl: insecure ? { rejectUnauthorized: false } : undefined,
  });
}

export async function waitForMeiliTask(client, taskUid) {
  const task = await client.waitForTask(taskUid, {
    timeOutMs: 600_000,
    intervalMs: 500,
  });
  if (task.status === "failed") {
    throw new Error(task.error?.message ?? "Meilisearch task failed");
  }
  return task;
}

export async function resolveMoviesPath() {
  return resolveDataPath();
}

export async function resolveDataPath() {
  if (process.env.DATA_JSON_PATH?.trim()) {
    return resolve(process.cwd(), process.env.DATA_JSON_PATH.trim());
  }
  if (process.env.CATALOG_JSON_PATH?.trim()) {
    return resolve(process.cwd(), process.env.CATALOG_JSON_PATH.trim());
  }
  if (process.env.MOVIES_JSON_PATH?.trim()) {
    return resolve(process.cwd(), process.env.MOVIES_JSON_PATH.trim());
  }

  if (getDataProfile() === "catalog") {
  const catalogPath = resolve(process.cwd(), "marwadihub-data.json");
    return catalogPath;
  }

  const enrichedPath = resolve(process.cwd(), "movies-enriched.json");
  const defaultMoviesPath = resolve(process.cwd(), "movies.json");
  try {
    await access(enrichedPath);
    return enrichedPath;
  } catch {
    return defaultMoviesPath;
  }
}

export function printBanner(engine, indexName) {
  console.log(`Engine: ${engine === "opensearch" ? "OpenSearch" : "Meilisearch"}`);
  console.log(`Index:  ${indexName}`);
}
