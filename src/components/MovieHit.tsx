import type { Hit } from "instantsearch.js";
import {
  formatReleaseYear,
  truncateOverview,
  type Movie,
} from "../types/movie";

type MovieHitProps = {
  hit: Hit<Movie>;
};

export function MovieHit({ hit }: MovieHitProps) {
  const year = formatReleaseYear(hit.release_date);
  const overview = truncateOverview(hit.overview ?? "");

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-accent/40 hover:shadow-lg hover:shadow-black/20">
      <div className="relative aspect-[2/3] overflow-hidden bg-surface">
        {hit.poster ? (
          <img
            src={hit.poster}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            No poster
          </div>
        )}
        {year && (
          <span className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
            {year}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3
          className="line-clamp-2 text-base font-semibold leading-snug"
          dangerouslySetInnerHTML={{
            __html: (hit._highlightResult?.title as { value?: string })?.value ?? hit.title,
          }}
        />
        {hit.genres?.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {hit.genres.slice(0, 3).map((genre) => (
              <li
                key={genre}
                className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted"
              >
                {genre}
              </li>
            ))}
          </ul>
        )}
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-text-muted">
          {overview || "No overview available."}
        </p>
      </div>
    </article>
  );
}
