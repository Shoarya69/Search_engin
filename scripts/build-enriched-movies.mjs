import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { resolve } from "node:path";

const ROOT = process.cwd();
const paths = {
  basics: resolve(ROOT, process.env.IMDB_BASICS_TSV?.trim() || "title.basics.tsv"),
  ratings: resolve(ROOT, process.env.IMDB_RATINGS_TSV?.trim() || "title.ratings.tsv"),
  akas: resolve(ROOT, process.env.IMDB_AKAS_TSV?.trim() || "title.akas.tsv"),
  movies: resolve(ROOT, process.env.MOVIES_JSON_PATH?.trim() || "movies.json"),
  out: resolve(ROOT, process.env.ENRICHED_MOVIES_PATH?.trim() || "movies-enriched.json"),
};

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTsvLine(line) {
  return line.split("\t");
}

async function loadRatings() {
  console.log(`Loading ratings from ${paths.ratings}…`);
  const map = new Map();
  const rl = createInterface({
    input: createReadStream(paths.ratings),
    crlfDelay: Infinity,
  });
  let first = true;
  for await (const line of rl) {
    if (first) {
      first = false;
      continue;
    }
    const [tconst, averageRating, numVotes] = parseTsvLine(line);
    if (!tconst) continue;
    map.set(tconst, {
      vote_average: Number.parseFloat(averageRating) || 0,
      num_votes: Number.parseInt(numVotes, 10) || 0,
    });
  }
  console.log(`  ${map.size.toLocaleString()} ratings loaded.`);
  return map;
}

async function loadTitleIndex(ratings) {
  console.log(`Streaming basics (movies only) from ${paths.basics}…`);
  const byTitle = new Map();
  let movieRows = 0;

  const rl = createInterface({
    input: createReadStream(paths.basics),
    crlfDelay: Infinity,
  });
  let first = true;
  for await (const line of rl) {
    if (first) {
      first = false;
      continue;
    }
    const cols = parseTsvLine(line);
    if (cols.length < 9) continue;
    const [tconst, titleType, primaryTitle, , , startYear, , , genresRaw] = cols;
    if (titleType !== "movie" || !primaryTitle || primaryTitle === "\\N") continue;
    movieRows += 1;

    const key = normalizeTitle(primaryTitle);
    if (!key) continue;

    const rating = ratings.get(tconst);
    const numVotes = rating?.num_votes ?? 0;
    const candidate = {
      imdb_id: tconst,
      start_year: startYear !== "\\N" ? Number.parseInt(startYear, 10) : null,
      imdb_genres: genresRaw !== "\\N" ? genresRaw.split(",") : [],
      vote_average: rating?.vote_average ?? 0,
      num_votes: numVotes,
    };

    const existing = byTitle.get(key);
    if (!existing || candidate.num_votes > existing.num_votes) {
      byTitle.set(key, candidate);
    }
  }

  console.log(
    `  ${movieRows.toLocaleString()} movie rows scanned; ${byTitle.size.toLocaleString()} unique titles indexed.`,
  );
  return byTitle;
}

async function loadAkasForTconsts(neededTconsts) {
  console.log(`Streaming akas for ${neededTconsts.size.toLocaleString()} matched titles…`);
  const map = new Map();

  const rl = createInterface({
    input: createReadStream(paths.akas),
    crlfDelay: Infinity,
  });
  let first = true;
  let lines = 0;
  for await (const line of rl) {
    if (first) {
      first = false;
      continue;
    }
    lines += 1;
    if (lines % 5_000_000 === 0) {
      console.log(`  …${lines.toLocaleString()} akas lines read`);
    }

    const cols = parseTsvLine(line);
    if (cols.length < 8) continue;
    const [titleId, , , region, language] = cols;
    if (!neededTconsts.has(titleId)) continue;

    let entry = map.get(titleId);
    if (!entry) {
      entry = { origin_regions: new Set(), languages: new Set() };
      map.set(titleId, entry);
    }
    if (region && region !== "\\N") entry.origin_regions.add(region);
    if (language && language !== "\\N") entry.languages.add(language);
  }

  console.log(`  ${map.size.toLocaleString()} titles with aka region/language data.`);
  return map;
}

async function main() {
  const ratings = await loadRatings();
  const byTitle = await loadTitleIndex(ratings);

  console.log(`Reading TMDB movies from ${paths.movies}…`);
  const movies = JSON.parse(await readFile(paths.movies, "utf8"));
  if (!Array.isArray(movies)) {
    throw new Error("movies.json must be an array");
  }

  const neededTconsts = new Set();
  for (const movie of movies) {
    const key = normalizeTitle(movie.title ?? "");
    const imdb = byTitle.get(key);
    if (imdb?.imdb_id) neededTconsts.add(imdb.imdb_id);
  }

  const akas = await loadAkasForTconsts(neededTconsts);

  let matched = 0;
  const enriched = movies.map((movie) => {
    const key = normalizeTitle(movie.title ?? "");
    const imdb = byTitle.get(key);
    if (!imdb) {
      return {
        ...movie,
        imdb_id: null,
        vote_average: 0,
        num_votes: 0,
        origin_regions: [],
        languages: [],
      };
    }

    matched += 1;
    const aka = akas.get(imdb.imdb_id);
    return {
      ...movie,
      imdb_id: imdb.imdb_id,
      vote_average: imdb.vote_average,
      num_votes: imdb.num_votes,
      origin_regions: aka ? [...aka.origin_regions] : [],
      languages: aka ? [...aka.languages] : [],
    };
  });

  await writeFile(paths.out, JSON.stringify(enriched));
  console.log(
    `Wrote ${paths.out} — ${enriched.length.toLocaleString()} movies, ${matched.toLocaleString()} matched to IMDb by title.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
