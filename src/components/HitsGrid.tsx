import type { Hit } from "instantsearch.js";
import { useHits, useInstantSearch } from "react-instantsearch";
import type { DataProfile } from "../lib/nlp/types";
import { MovieHit } from "./MovieHit";
import { CatalogHit } from "./CatalogHit";
import { EmptyState } from "./EmptyState";
import { SearchError } from "./SearchError";
import type { Movie } from "../types/movie";
import type { CatalogBusiness } from "../types/catalog";

function HitSkeleton({ profile }: { profile: DataProfile }) {
  if (profile === "catalog") {
    return (
      <div className="animate-pulse rounded-2xl border border-border bg-surface-elevated p-4">
        <div className="mb-2 h-5 w-3/4 rounded bg-surface" />
        <div className="h-3 w-1/2 rounded bg-surface" />
      </div>
    );
  }
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      <div className="aspect-[2/3] bg-surface" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-surface" />
        <div className="h-3 w-full rounded bg-surface" />
      </div>
    </div>
  );
}

type HitsGridProps = {
  dataProfile: DataProfile;
};

export function HitsGrid({ dataProfile }: HitsGridProps) {
  const { hits } = useHits<Movie | CatalogBusiness>();
  const { status, error } = useInstantSearch({ catchError: true });
  const isLoading = status === "loading" || status === "stalled";

  const gridClass =
    dataProfile === "catalog"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      : "grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4";

  if (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error);
    return <SearchError message={message} />;
  }

  if (isLoading && hits.length === 0) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 8 }).map((_, i) => (
          <HitSkeleton key={i} profile={dataProfile} />
        ))}
      </div>
    );
  }

  if (hits.length === 0) {
    return <EmptyState dataProfile={dataProfile} />;
  }

  return (
    <ul className={gridClass}>
      {hits.map((hit) => (
        <li key={hit.objectID ?? String(hit.id)} className="min-w-0">
          {dataProfile === "catalog" ? (
            <CatalogHit hit={hit as Hit<CatalogBusiness>} />
          ) : (
            <MovieHit hit={hit as Hit<Movie>} />
          )}
        </li>
      ))}
    </ul>
  );
}
