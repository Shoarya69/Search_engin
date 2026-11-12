import type { SearchClient } from "instantsearch.js";
import type { OpenSearchClientEnv } from "../../config/env";

type SortSpec = { field: string; order: "asc" | "desc" };

const FACET_ATTRIBUTES = [
  "genres",
  "origin_regions",
  "languages",
  "city",
  "state",
  "category_labels",
  "business_type",
] as const;

function parseIndexRef(indexName: string): { index: string; sort?: SortSpec } {
  const parts = indexName.split(":");
  if (parts.length === 3) {
    return {
      index: parts[0],
      sort: { field: parts[1], order: parts[2] as "asc" | "desc" },
    };
  }
  return { index: indexName };
}

function authHeaders(env: OpenSearchClientEnv): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (env.apiKey) {
    headers.Authorization = `ApiKey ${env.apiKey}`;
  } else if (env.username && env.password) {
    headers.Authorization = `Basic ${btoa(`${env.username}:${env.password}`)}`;
  }
  return headers;
}

function parseFacetFilterGroup(group: string[]): Record<string, unknown>[] {
  const should: Record<string, unknown>[] = [];
  for (const entry of group) {
    const colon = entry.indexOf(":");
    if (colon === -1) continue;
    const attribute = entry.slice(0, colon);
    const value = entry.slice(colon + 1);
    should.push({ term: { [attribute]: value } });
  }
  if (should.length === 0) return [];
  if (should.length === 1) return [should[0]];
  return [{ bool: { should, minimum_should_match: 1 } }];
}

function buildFilterClause(
  facetFilters?: string[][] | string[],
): Record<string, unknown>[] {
  if (!facetFilters?.length) return [];

  const groups = Array.isArray(facetFilters[0])
    ? (facetFilters as string[][])
    : [facetFilters as string[]];

  const filters: Record<string, unknown>[] = [];
  for (const group of groups) {
    filters.push(...parseFacetFilterGroup(group));
  }
  return filters;
}

function buildQueryBody(
  params: Record<string, unknown>,
  indexName: string,
  facetAttribute?: string,
) {
  const { index, sort } = parseIndexRef(indexName);
  const query = String(params.query ?? "").trim();
  const page = Number(params.page ?? 0);
  const hitsPerPage = Number(params.hitsPerPage ?? 16);
  const facetFilters = params.facetFilters as string[][] | string[] | undefined;

  const filterClause = buildFilterClause(facetFilters);

  const must: Record<string, unknown>[] = query
    ? [
        {
          multi_match: {
            query,
            fields: [
              "title^3",
              "name^3",
              "search_text^2",
              "overview",
              "genres",
              "category_labels",
              "city",
              "state",
            ],
            type: "best_fields",
            fuzziness: "AUTO",
          },
        },
      ]
    : [{ match_all: {} }];

  const body: Record<string, unknown> = {
    from: facetAttribute ? 0 : page * hitsPerPage,
    size: facetAttribute ? 0 : hitsPerPage,
    query: {
      bool: {
        must,
        filter: filterClause,
      },
    },
    highlight: {
      pre_tags: ["__ais-highlight__"],
      post_tags: ["__/ais-highlight__"],
      fields: { title: {}, name: {} },
    },
  };

  if (sort && !facetAttribute) {
    body.sort = [{ [sort.field]: { order: sort.order } }];
  }

  if (!facetAttribute) {
    body.aggs = Object.fromEntries(
      FACET_ATTRIBUTES.map((attr) => [
        attr,
        { terms: { field: attr, size: 50 } },
      ]),
    );
  } else {
    body.aggs = {
      [facetAttribute]: {
        terms: { field: facetAttribute, size: 50 },
      },
    };
  }

  return { index, body };
}

function mapFacets(aggregations: Record<string, { buckets?: { key: string; doc_count: number }[] }> | undefined) {
  const facets: Record<string, Record<string, number>> = {};
  if (!aggregations) return facets;

  for (const attr of FACET_ATTRIBUTES) {
    const buckets = aggregations[attr]?.buckets;
    if (!buckets?.length) continue;
    facets[attr] = Object.fromEntries(
      buckets.map((b) => [String(b.key), b.doc_count]),
    );
  }
  return facets;
}

function mapHit(source: Record<string, unknown>, highlight?: Record<string, string[]>) {
  const id = source.id;
  const titleHighlight = highlight?.title?.[0];
  const nameHighlight = highlight?.name?.[0];
  const hl = titleHighlight ?? nameHighlight;
  const hlField = titleHighlight ? "title" : "name";
  return {
    ...source,
    objectID: String(id ?? source.imdb_id ?? ""),
    _highlightResult: hl
      ? { [hlField]: { value: hl }, ...(nameHighlight && { name: { value: nameHighlight } }) }
      : undefined,
  };
}

async function runSearch(
  env: OpenSearchClientEnv,
  index: string,
  body: Record<string, unknown>,
) {
  const url = `${env.url.replace(/\/$/, "")}/${index}/_search`;
  const started = performance.now();
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(env),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenSearch search failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const took = Math.round(performance.now() - started);
  return { payload, took };
}

export function createOpenSearchInstantSearchClient(
  env: OpenSearchClientEnv,
): SearchClient {
  return {
    search(requests) {
      return Promise.all(
        requests.map(async (request) => {
          const params = request.params ?? {};
          const { index, body } = buildQueryBody(
            params as Record<string, unknown>,
            request.indexName,
          );

          const { payload, took } = await runSearch(env, index, body);
          const hits = payload.hits?.hits ?? [];
          const total =
            typeof payload.hits?.total === "number"
              ? payload.hits.total
              : payload.hits?.total?.value ?? 0;
          const hitsPerPage = Number(params.hitsPerPage ?? 16);
          const page = Number(params.page ?? 0);

          return {
            hits: hits.map(
              (hit: {
                _source: Record<string, unknown>;
                highlight?: Record<string, string[]>;
              }) => mapHit(hit._source, hit.highlight),
            ),
            nbHits: total,
            page,
            nbPages: Math.max(1, Math.ceil(total / hitsPerPage)),
            hitsPerPage,
            processingTimeMS: payload.took ?? took,
            facets: mapFacets(payload.aggregations),
            exhaustiveNbHits: true,
            query: String(params.query ?? ""),
            params: "",
          };
        }),
      ).then((results) => ({ results }));
    },
  };
}
