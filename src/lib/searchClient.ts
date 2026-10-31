import { instantMeiliSearch } from "@meilisearch/instant-meilisearch";
import type { ClientEnv } from "../config/env";

export function createSearchClient(env: ClientEnv) {
  return instantMeiliSearch(env.host, env.searchApiKey, {
    placeholderSearch: true,
    finitePagination: true,
  });
}
