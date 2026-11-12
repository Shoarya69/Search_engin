import type { ParsedNaturalQuery } from "../parseNaturalQuery";

export type NlpMode = "rules" | "gliner" | "hybrid";
export type DataProfile = "movies" | "catalog";

export type NerEntity = {
  text: string;
  label: string;
  score: number;
};

export type SemanticSearchParse = {
  searchText: string;
  facetFilters: string[][];
  sort: ParsedNaturalQuery["sort"];
  chips: string[];
  sources: Array<"rules" | "gliner">;
};
