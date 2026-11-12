import {
  categoriesLongestFirst,
  matchCategory,
} from "./catalogCategories";
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

  for (const label of categoriesLongestFirst()) {
    const canonical = matchCategory(label);
    if (!canonical) continue;
    const phrase = label.toLowerCase().replace(/&/g, " and ");
    const padded = ` ${working.replace(/&/g, " and ").replace(/\s+/g, " ")} `;
    const singular = phrase.replace(/\b([a-z]{4,})s\b/g, "$1");
    const hit = padded.includes(` ${phrase} `)
      ? phrase
      : padded.includes(` ${singular} `)
        ? singular
        : null;
    if (!hit) continue;
    facetFilters.push([`category_labels:${canonical}`]);
    chips.push(`product category: ${canonical}`);
    working = stripPhrase(working.replace(/&/g, " and "), hit);
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
