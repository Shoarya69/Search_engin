import type { SemanticSearchParse } from "./types";

const STOP = new Set([
  "a",
  "an",
  "the",
  "in",
  "near",
  "for",
  "me",
  "find",
  "shop",
  "store",
  "business",
  "dikhao",
  "chahiye",
  "chaiye",
]);

const STATE_HINTS = ["rajasthan", "gujarat", "maharashtra", "delhi", "punjab"];
const CITY_HINTS = [
  "jodhpur",
  "jaipur",
  "udaipur",
  "sirohi",
  "surat",
  "mumbai",
  "delhi",
];

function stripPhrase(text: string, phrase: string): string {
  const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  return text.replace(re, " ");
}

export function parseCatalogRules(raw: string): SemanticSearchParse {
  let working = ` ${raw.toLowerCase().trim()} `;
  const facetFilters: string[][] = [];
  const chips: string[] = [];

  for (const city of CITY_HINTS) {
    if (working.includes(` ${city} `)) {
      const proper =
        city.charAt(0).toUpperCase() + city.slice(1);
      facetFilters.push([`city:${proper}`]);
      chips.push(`city: ${proper}`);
      working = stripPhrase(working, city);
    }
  }

  for (const state of STATE_HINTS) {
    if (working.includes(` ${state} `)) {
      const proper =
        state.charAt(0).toUpperCase() + state.slice(1);
      facetFilters.push([`state:${proper}`]);
      chips.push(`state: ${proper}`);
      working = stripPhrase(working, state);
    }
  }

  const searchText = working
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP.has(t))
    .join(" ")
    .trim();

  return {
    searchText: searchText || raw.trim(),
    facetFilters,
    sort: "relevance",
    chips,
    sources: ["rules"],
  };
}
