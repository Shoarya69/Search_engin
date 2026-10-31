import { useHits, useInstantSearch } from "react-instantsearch";
import { MovieHit } from "./MovieHit";
import { EmptyState } from "./EmptyState";
import type { Movie } from "../types/movie";

function HitSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border bg-surface-elevated">
      <div className="aspect-[2/3] bg-surface" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-surface" />
        <div className="h-3 w-full rounded bg-surface" />
        <div className="h-3 w-5/6 rounded bg-surface" />
      </div>
    </div>
  );
}

export function HitsGrid() {
  const { hits } = useHits<Movie>();
  const { status } = useInstantSearch();
  const isLoading = status === "loading" || status === "stalled";

  if (isLoading && hits.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <HitSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (hits.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {hits.map((hit) => (
        <li key={hit.objectID ?? hit.id} className="min-w-0">
          <MovieHit hit={hit} />
        </li>
      ))}
    </ul>
  );
}
