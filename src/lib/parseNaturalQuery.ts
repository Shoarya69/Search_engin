export type ParsedNaturalQuery = {
  /** Text sent to Meilisearch full-text search */
  searchText: string;
  genres: string[];
  originRegions: string[];
  languages: string[];
  /** Meilisearch sort index value suffix, e.g. vote_average:desc */
  sort: "relevance" | "vote_average:desc" | "release_date:desc" | "release_date:asc";
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "movie",
  "movies",
  "film",
  "films",
  "show",
  "me",
  "find",
  "get",
  "with",
  "for",
  "of",
  "in",
  "please",
]);

const REGION_KEYWORDS: Record<string, string> = {
  indian: "IN",
  india: "IN",
  bollywood: "IN",
  hindi: "IN",
};

const LANGUAGE_KEYWORDS: Record<string, string> = {
  hindi: "hi",
  tamil: "ta",
  telugu: "te",
  malayalam: "ml",
  kannada: "kn",
  bengali: "bn",
  punjabi: "pa",
  english: "en",
  japanese: "ja",
  korean: "ko",
};

const GENRE_PHRASES: [string, string][] = [
  ["science fiction", "Science Fiction"],
  ["sci fi", "Science Fiction"],
  ["sci-fi", "Science Fiction"],
  ["tv movie", "TV Movie"],
  ["film noir", "Film-Noir"],
  ["action", "Action"],
  ["adventure", "Adventure"],
  ["animation", "Animation"],
  ["comedy", "Comedy"],
  ["crime", "Crime"],
  ["documentary", "Documentary"],
  ["drama", "Drama"],
  ["family", "Family"],
  ["fantasy", "Fantasy"],
  ["history", "History"],
  ["horror", "Horror"],
  ["music", "Music"],
  ["mystery", "Mystery"],
  ["romance", "Romance"],
  ["thriller", "Thriller"],
  ["war", "War"],
  ["western", "Western"],
];

const BEST_WORDS = new Set(["best", "top", "greatest", "highest", "rated"]);
const NEWEST_WORDS = new Set(["newest", "latest", "recent"]);
const OLDEST_WORDS = new Set(["oldest", "classic", "earliest"]);

function stripPhrase(text: string, phrase: string): string {
  const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  return text.replace(re, " ");
}

export function parseNaturalQuery(raw: string): ParsedNaturalQuery {
  let working = ` ${raw.toLowerCase().trim()} `;
  const genres: string[] = [];
  const originRegions: string[] = [];
  const languages: string[] = [];
  let sort: ParsedNaturalQuery["sort"] = "relevance";

  for (const word of BEST_WORDS) {
    if (working.includes(` ${word} `)) {
      sort = "vote_average:desc";
      working = stripPhrase(working, word);
    }
  }
  for (const word of NEWEST_WORDS) {
    if (working.includes(` ${word} `)) {
      sort = "release_date:desc";
      working = stripPhrase(working, word);
    }
  }
  for (const word of OLDEST_WORDS) {
    if (working.includes(` ${word} `)) {
      sort = "release_date:asc";
      working = stripPhrase(working, word);
    }
  }

  for (const [phrase, genre] of GENRE_PHRASES) {
    if (working.includes(` ${phrase} `)) {
      if (!genres.includes(genre)) genres.push(genre);
      working = stripPhrase(working, phrase);
    }
  }

  for (const [word, region] of Object.entries(REGION_KEYWORDS)) {
    if (working.includes(` ${word} `)) {
      if (!originRegions.includes(region)) originRegions.push(region);
      if (word in LANGUAGE_KEYWORDS) {
        const lang = LANGUAGE_KEYWORDS[word];
        if (!languages.includes(lang)) languages.push(lang);
      }
      working = stripPhrase(working, word);
    }
  }

  for (const [word, lang] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (working.includes(` ${word} `)) {
      if (!languages.includes(lang)) languages.push(lang);
      working = stripPhrase(working, word);
    }
  }

  const searchText = working
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t))
    .join(" ")
    .trim();

  return {
    searchText,
    genres,
    originRegions,
    languages,
    sort,
  };
}

export function buildMeilisearchFilter(parsed: ParsedNaturalQuery): string | undefined {
  const clauses: string[] = [];

  for (const genre of parsed.genres) {
    clauses.push(`genres = "${genre.replace(/"/g, '\\"')}"`);
  }

  if (parsed.originRegions.length === 1) {
    clauses.push(`origin_regions = "${parsed.originRegions[0]}"`);
  } else if (parsed.originRegions.length > 1) {
    clauses.push(
      `(${parsed.originRegions.map((r) => `origin_regions = "${r}"`).join(" OR ")})`,
    );
  }

  if (parsed.languages.length === 1) {
    clauses.push(`languages = "${parsed.languages[0]}"`);
  } else if (parsed.languages.length > 1) {
    clauses.push(
      `(${parsed.languages.map((l) => `languages = "${l}"`).join(" OR ")})`,
    );
  }

  if (clauses.length === 0) return undefined;
  return clauses.join(" AND ");
}
