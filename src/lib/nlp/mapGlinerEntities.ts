import type { NerEntity } from "./types";

const LABEL_TO_FACET: Record<string, string> = {
  city: "city",
  state: "state",
  location: "city",
  area: "city",
  "product category": "category_labels",
  "business type": "business_type",
  product: "_search",
  service: "_search",
  "business name": "_search",
  "price intent": "_ignore",
};

export function mapGlinerToFacets(
  entities: NerEntity[],
  query?: string,
): {
  facetFilters: string[][];
  chips: string[];
  searchParts: string[];
} {
  const facetFilters: string[][] = [];
  const chips: string[] = [];
  const searchParts: string[] = [];
  const queryNorm = query?.trim().toLowerCase();

  for (const entity of entities) {
    const facet = LABEL_TO_FACET[entity.label.toLowerCase()] ?? "_search";
    const value = entity.text.trim();
    if (!value) continue;

    if (facet === "_ignore") {
      chips.push(`Price: ${value}`);
      continue;
    }
    if (facet === "_search") {
      searchParts.push(value);
      const isWholeQuery =
        queryNorm && value.toLowerCase() === queryNorm;
      if (!isWholeQuery) {
        chips.push(`${entity.label}: ${value}`);
      }
      continue;
    }
    facetFilters.push([`${facet}:${value}`]);
    chips.push(`${entity.label}: ${value}`);
  }

  return { facetFilters, chips, searchParts };
}

/** Remove only location/facet spans; keep product and name tokens in the text query. */
export function stripFacetEntityTexts(
  query: string,
  entities: NerEntity[],
): string {
  let text = query;
  for (const entity of entities) {
    const facet = LABEL_TO_FACET[entity.label.toLowerCase()] ?? "_search";
    if (facet === "_search" || facet === "_ignore") continue;
    const escaped = entity.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escaped, "gi"), " ");
  }
  return text.replace(/\s+/g, " ").trim();
}

export function stripEntityTexts(query: string, entities: NerEntity[]): string {
  let text = query;
  for (const entity of entities) {
    const escaped = entity.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escaped, "gi"), " ");
  }
  return text.replace(/\s+/g, " ").trim();
}
