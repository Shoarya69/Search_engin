import { RefinementList } from "react-instantsearch";

export function GenreRefinement() {
  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Genres
      </h2>
      <RefinementList
        attribute="genres"
        limit={12}
        showMore
        showMoreLimit={30}
        sortBy={["name:asc"]}
        classNames={{
          root: "space-y-1",
          list: "max-h-[min(60vh,28rem)] space-y-0.5 overflow-y-auto pr-1",
          item: "flex items-center",
          label:
            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-text-muted transition hover:bg-surface-elevated hover:text-ink",
          checkbox:
            "h-4 w-4 shrink-0 rounded border-border bg-surface accent-accent",
          labelText: "truncate",
          count:
            "ml-auto shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-xs tabular-nums text-text-muted",
          showMore:
            "mt-2 w-full rounded-lg py-2 text-xs font-medium text-accent hover:bg-surface-elevated",
        }}
      />
    </aside>
  );
}
