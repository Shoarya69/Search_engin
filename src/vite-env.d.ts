/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEARCH_ENGINE?: string;
  readonly VITE_SEARCH_INDEX_NAME?: string;
  readonly VITE_MEILISEARCH_HOST?: string;
  readonly VITE_MEILISEARCH_SEARCH_API_KEY?: string;
  readonly VITE_MEILISEARCH_INDEX_NAME?: string;
  readonly VITE_OPENSEARCH_URL?: string;
  readonly VITE_OPENSEARCH_INDEX?: string;
  readonly VITE_OPENSEARCH_USERNAME?: string;
  readonly VITE_OPENSEARCH_PASSWORD?: string;
  readonly VITE_OPENSEARCH_API_KEY?: string;
  readonly VITE_DATA_PROFILE?: string;
  readonly VITE_NLP_MODE?: string;
  readonly VITE_NLP_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface RuntimeConfig {
  searchEngine?: string;
  indexName?: string;
  meiliHost?: string;
  meiliSearchKey?: string;
  nlpMode?: string;
  nlpApiUrl?: string;
  dataProfile?: string;
  opensearchUrl?: string;
  opensearchUsername?: string;
  opensearchPassword?: string;
  opensearchApiKey?: string;
}

interface Window {
  __RUNTIME_CONFIG__?: RuntimeConfig;
}
