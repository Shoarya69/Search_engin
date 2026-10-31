export type Movie = {
  id: number;
  title: string;
  overview: string;
  genres: string[];
  poster: string;
  release_date: number;
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
