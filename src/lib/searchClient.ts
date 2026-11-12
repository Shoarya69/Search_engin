import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import type { SearchClient } from "instantsearch.js";
import type { ClientEnv } from "../config/env";
import { createOpenSearchInstantSearchClient } from "./opensearch/instantSearchClient";

export function createSearchClient(env: ClientEnv): {
  searchClient: SearchClient;
} {
  if (env.engine === "opensearch") {
    return {
      searchClient: createOpenSearchInstantSearchClient(env),
    };
  }

  const { searchClient } = instantMeiliSearch(env.host, env.searchApiKey, {
    placeholderSearch: true,
    finitePagination: true,
  });

  return { searchClient: searchClient as unknown as SearchClient };
}
