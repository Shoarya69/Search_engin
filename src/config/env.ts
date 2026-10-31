export type ClientEnv = {
  host: string;
  searchApiKey: string;
  indexName: string;
};

export type EnvValidation =
  | { ok: true; env: ClientEnv }
  | { ok: false; missing: string[] };

export function validateClientEnv(): EnvValidation {
  const host = import.meta.env.VITE_MEILISEARCH_HOST?.trim();
  const searchApiKey = import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY?.trim();
  const indexName =
    import.meta.env.VITE_MEILISEARCH_INDEX_NAME?.trim() || "movies";

  const missing: string[] = [];
  if (!host) missing.push("VITE_MEILISEARCH_HOST");
  if (!searchApiKey) missing.push("VITE_MEILISEARCH_SEARCH_API_KEY");

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return {
    ok: true,
    env: { host: host!, searchApiKey: searchApiKey!, indexName },
  };
}
