import { useInstantSearch } from "react-instantsearch";

export function EmptyState() {
  const { indexUiState } = useInstantSearch();
  const hasQuery = Boolean(indexUiState.query?.trim());
  const hasGenreFilter = Boolean(indexUiState.refinementList?.genres?.length);

  return (
    <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface-elevated/50 px-6 py-16 text-center">
      <p className="text-lg font-medium text-white">No movies found</p>
      <p className="mt-2 text-sm text-text-muted">
        {hasQuery || hasGenreFilter
          ? "Try a different search term or clear your genre filters."
          : "Start typing to search thousands of movies."}
      </p>
    </div>
  );
}
