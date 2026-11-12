import type { DataProfile, NlpMode } from "../lib/nlp/types";

export type SearchEngine = "meilisearch" | "opensearch";

export type MeilisearchClientEnv = {
  engine: "meilisearch";
  indexName: string;
  host: string;
  searchApiKey: string;
};

export type OpenSearchClientEnv = {
  engine: "opensearch";
  indexName: string;
  url: string;
  username?: string;
  password?: string;
  apiKey?: string;
};

export type ClientEnv = (MeilisearchClientEnv | OpenSearchClientEnv) & {
  dataProfile: DataProfile;
  nlpMode: NlpMode;
  nlpApiUrl?: string;
};

function runtimeConfig(): RuntimeConfig {
  if (typeof window === "undefined") return {};
  return window.__RUNTIME_CONFIG__ ?? {};
}

/** Relative paths like `/meili` become same-origin URLs so one image works on any host. */
function publicUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${trimmed}`;
  }
  return trimmed;
}

function parseNlpMode(raw: string | undefined): NlpMode {
  const v = raw?.trim().toLowerCase();
  if (v === "gliner" || v === "hybrid") return v;
  return "rules";
}

function parseDataProfile(raw: string | undefined): DataProfile {
  return raw?.trim().toLowerCase() === "catalog" ? "catalog" : "movies";
}

export type EnvValidation =
  | { ok: true; env: ClientEnv }
  | { ok: false; missing: string[]; engine: SearchEngine | null };

function parseEngine(raw: string | undefined): SearchEngine {
  const value = raw?.trim().toLowerCase();
  if (value === "opensearch") return "opensearch";
  return "meilisearch";
}

export function validateClientEnv(): EnvValidation {
  const rc = runtimeConfig();
  const engine = parseEngine(
    rc.searchEngine || import.meta.env.VITE_SEARCH_ENGINE,
  );
  const dataProfile = parseDataProfile(
    rc.dataProfile || import.meta.env.VITE_DATA_PROFILE,
  );
  const nlpMode = parseNlpMode(rc.nlpMode || import.meta.env.VITE_NLP_MODE);
  const nlpApiUrl = publicUrl(rc.nlpApiUrl || import.meta.env.VITE_NLP_API_URL);
  const indexName =
    rc.indexName?.trim() ||
    import.meta.env.VITE_SEARCH_INDEX_NAME?.trim() ||
    import.meta.env.VITE_MEILISEARCH_INDEX_NAME?.trim() ||
    import.meta.env.VITE_OPENSEARCH_INDEX?.trim() ||
    "movies";

  if (engine === "opensearch") {
    const url = publicUrl(rc.opensearchUrl || import.meta.env.VITE_OPENSEARCH_URL);
    const username = (
      rc.opensearchUsername || import.meta.env.VITE_OPENSEARCH_USERNAME
    )?.trim();
    const password = (
      rc.opensearchPassword || import.meta.env.VITE_OPENSEARCH_PASSWORD
    )?.trim();
    const apiKey = (
      rc.opensearchApiKey || import.meta.env.VITE_OPENSEARCH_API_KEY
    )?.trim();

    const missing: string[] = [];
    if (!url) {
      missing.push(
        "VITE_OPENSEARCH_URL (e.g. /opensearch or http://localhost:9200)",
      );
    }

    if (missing.length > 0) {
      return { ok: false, missing, engine };
    }

    // Auth is optional when OpenSearch security is disabled
    const hasBasicAuth = Boolean(username && password);

    return {
      ok: true,
      env: {
        engine: "opensearch",
        indexName,
        url: url!,
        username: hasBasicAuth ? username : undefined,
        password: hasBasicAuth ? password : undefined,
        apiKey: apiKey || undefined,
        dataProfile,
        nlpMode,
        nlpApiUrl,
      },
    };
  }

  const host = publicUrl(rc.meiliHost || import.meta.env.VITE_MEILISEARCH_HOST);
  const searchApiKey = (
    rc.meiliSearchKey || import.meta.env.VITE_MEILISEARCH_SEARCH_API_KEY
  )?.trim();

  const missing: string[] = [];
  if (!host) missing.push("VITE_MEILISEARCH_HOST");
  if (!searchApiKey) missing.push("VITE_MEILISEARCH_SEARCH_API_KEY");

  if (missing.length > 0) {
    return { ok: false, missing, engine };
  }

  return {
    ok: true,
    env: {
      engine: "meilisearch",
      indexName,
      host: host!,
      searchApiKey: searchApiKey!,
      dataProfile,
      nlpMode,
      nlpApiUrl,
    },
  };
}
