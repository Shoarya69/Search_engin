import { SortBy as InstantSortBy } from "react-instantsearch";

type SortByProps = {
  indexName: string;
};

export function SortBy({ indexName }: SortByProps) {
  return (
    <InstantSortBy
      items={[
        { label: "Relevance", value: indexName },
        { label: "Top rated", value: `${indexName}:vote_average:desc` },
        { label: "Newest first", value: `${indexName}:release_date:desc` },
        { label: "Oldest first", value: `${indexName}:release_date:asc` },
      ]}
      classNames={{
        root: "relative",
        select:
          "cursor-pointer appearance-none rounded-lg border border-border bg-surface-elevated py-2 pl-3 pr-9 text-sm text-white outline-none focus:border-accent focus:ring-2 focus:ring-accent/30",
      }}
    />
  );
}
