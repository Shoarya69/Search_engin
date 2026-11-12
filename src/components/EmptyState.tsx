import { useInstantSearch } from "react-instantsearch";
import type { DataProfile } from "../lib/nlp/types";

type EmptyStateProps = {
  dataProfile?: DataProfile;
};

export function EmptyState({ dataProfile = "movies" }: EmptyStateProps) {
  const { indexUiState } = useInstantSearch();
  const hasQuery = Boolean(indexUiState.query?.trim());
  const hasGenreFilter = Boolean(indexUiState.refinementList?.genres?.length);
  const hasCatalogFilter = Boolean(
    indexUiState.refinementList?.city?.length ||
      indexUiState.refinementList?.state?.length,
  );

  const label = dataProfile === "catalog" ? "businesses" : "movies";

  return (
    <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface-elevated/50 px-6 py-16 text-center">
      <p className="text-lg font-medium text-ink">No {label} found</p>
      <p className="mt-2 text-sm text-text-muted">
        {hasQuery || hasGenreFilter || hasCatalogFilter
          ? "Try a different search term or clear your filters."
          : dataProfile === "catalog"
            ? "Start typing a product or business name."
            : "Start typing to search movies."}
      </p>
    </div>
  );
}
