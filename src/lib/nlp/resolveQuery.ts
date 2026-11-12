import { buildFacetFilters, parseNaturalQuery } from "../parseNaturalQuery";
import { fetchGlinerEntities } from "./fetchGliner";
import {
  mapGlinerToFacets,
  stripEntityTexts,
  stripFacetEntityTexts,
} from "./mapGlinerEntities";
import { parseCatalogRules } from "./parseCatalogRules";
import type { DataProfile, NlpMode, SemanticSearchParse } from "./types";

function mergeFacetFilters(
  ...groups: string[][][]
): string[][] {
  const seen = new Set<string>();
  const out: string[][] = [];
  for (const list of groups) {
    for (const group of list) {
      const key = group.join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(group);
    }
  }
  return out;
}

function rulesParse(query: string, profile: DataProfile): SemanticSearchParse {
  if (profile === "catalog") {
    return parseCatalogRules(query);
  }

  const parsed = parseNaturalQuery(query);
  return {
    searchText: parsed.searchText,
    facetFilters: buildFacetFilters(parsed),
    sort: parsed.sort,
    chips: [
      ...parsed.genres,
      ...parsed.originRegions.map((r) => (r === "IN" ? "India" : r)),
      ...parsed.languages.map((l) => `lang:${l}`),
      ...(parsed.sort === "vote_average:desc" ? ["Top rated"] : []),
      ...(parsed.sort === "release_date:desc" ? ["Newest"] : []),
    ],
    sources: ["rules"],
  };
}

function glinerParse(
  query: string,
  entities: Awaited<ReturnType<typeof fetchGlinerEntities>>,
  profile: DataProfile,
): SemanticSearchParse {
  const { facetFilters, chips, searchParts } = mapGlinerToFacets(
    entities,
    query,
  );
  let searchText =
    profile === "catalog"
      ? stripFacetEntityTexts(query, entities)
      : stripEntityTexts(query, entities);
  if (searchParts.length > 0 && !searchText) {
    searchText = searchParts.join(" ");
  }
  if (!searchText.trim()) {
    searchText = query.trim();
  }

  return {
    searchText,
    facetFilters,
    sort: "relevance",
    chips,
    sources: ["gliner"],
  };
}

function hybridParse(
  rules: SemanticSearchParse,
  ner: SemanticSearchParse,
): SemanticSearchParse {
  return {
    searchText: rules.searchText.trim() || ner.searchText.trim() || "",
    facetFilters: mergeFacetFilters(rules.facetFilters, ner.facetFilters),
    sort: rules.sort !== "relevance" ? rules.sort : ner.sort,
    chips: [...rules.chips, ...ner.chips],
    sources: ["rules", "gliner"],
  };
}

export async function resolveQuery(
  query: string,
  options: {
    mode: NlpMode;
    profile: DataProfile;
    glinerApiUrl?: string;
    signal?: AbortSignal;
  },
): Promise<SemanticSearchParse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      searchText: "",
      facetFilters: [],
      sort: "relevance",
      chips: [],
      sources: [],
    };
  }

  const rules = rulesParse(trimmed, options.profile);

  if (options.mode === "rules" || !options.glinerApiUrl) {
    return rules;
  }

  try {
    const entities = await fetchGlinerEntities(
      trimmed,
      options.glinerApiUrl,
      options.signal,
    );
    const ner = glinerParse(trimmed, entities, options.profile);

    if (options.mode === "gliner") {
      return ner;
    }
    return hybridParse(rules, ner);
  } catch {
    return rules;
  }
}
