import { Pagination, Stats } from "react-instantsearch";

export function StatsAndPagination() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Stats
        classNames={{
          root: "text-sm text-text-muted",
        }}
        translations={{
          rootElementText({ nbHits, processingTimeMS }) {
            const hitLabel = nbHits === 1 ? "result" : "results";
            return `${nbHits.toLocaleString()} ${hitLabel} in ${processingTimeMS}ms`;
          },
        }}
      />
      <Pagination
        classNames={{
          root: "flex justify-center sm:justify-end",
          list: "flex flex-wrap items-center gap-1",
          item: "min-w-[2.25rem]",
          link: "flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-transparent px-2 text-sm text-text-muted transition hover:bg-surface-elevated hover:text-white",
          selectedItem: "[&_.ais-Pagination-link]:border-accent [&_.ais-Pagination-link]:bg-accent/15 [&_.ais-Pagination-link]:text-white",
          disabledItem: "opacity-40 pointer-events-none",
        }}
      />
    </div>
  );
}
