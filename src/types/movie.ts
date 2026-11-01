export type Movie = {
  id: number;
  title: string;
  overview: string;
  genres: string[];
  poster: string;
  release_date: number;
  imdb_id?: string | null;
  vote_average?: number;
  num_votes?: number;
  origin_regions?: string[];
  languages?: string[];
};

export function formatReleaseYear(releaseDate: number | undefined): string | null {
  if (releaseDate == null || Number.isNaN(releaseDate)) {
    return null;
  }
  const date = new Date(releaseDate * 1000);
  const year = date.getUTCFullYear();
  if (year < 1880 || year > 2100) {
    return null;
  }
  return String(year);
}

export function truncateOverview(text: string, maxLength = 160): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function formatRating(voteAverage: number | undefined): string | null {
  if (voteAverage == null || voteAverage <= 0) return null;
  return voteAverage.toFixed(1);
}
