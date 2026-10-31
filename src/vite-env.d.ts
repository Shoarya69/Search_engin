/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEILISEARCH_HOST: string;
  readonly VITE_MEILISEARCH_SEARCH_API_KEY: string;
  readonly VITE_MEILISEARCH_INDEX_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
