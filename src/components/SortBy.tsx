import { useEffect, useMemo } from "react";
import { useSortBy } from "react-instantsearch";
import type { SemanticSearchParse } from "../lib/nlp/types";

type SortByProps = {
  indexName: string;
  externalSort?: SemanticSearchParse["sort"];
  enabled?: boolean;
};

function sortToIndexValue(
  sort: SemanticSearchParse["sort"],
  indexName: string,
): string {
  if (sort === "vote_average:desc") return `${indexName}:vote_average:desc`;
  if (sort === "release_date:desc") return `${indexName}:release_date:desc`;
  if (sort === "release_date:asc") return `${indexName}:release_date:asc`;
  return indexName;
}

export function SortBy({
  indexName,
  externalSort,
  enabled = true,
}: SortByProps) {
  const items = useMemo(
    () => [
      { label: "Relevance", value: indexName },
      { label: "Top rated", value: `${indexName}:vote_average:desc` },
      { label: "Newest first", value: `${indexName}:release_date:desc` },
      { label: "Oldest first", value: `${indexName}:release_date:asc` },
    ],
    [indexName],
  );

  const { options, currentRefinement, refine } = useSortBy({ items });

  useEffect(() => {
    if (!enabled || !externalSort || externalSort === "relevance") return;
    const target = sortToIndexValue(externalSort, indexName);
    if (currentRefinement !== target) refine(target);
  }, [externalSort, enabled, indexName, refine, currentRefinement]);

  if (!enabled) return null;

  return (
    <select
      value={currentRefinement}
      onChange={(event) => refine(event.target.value)}
      aria-label="Sort results"
      className="cursor-pointer appearance-none rounded-lg border border-border bg-surface-elevated py-2 pl-3 pr-9 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
