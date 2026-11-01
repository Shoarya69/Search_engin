import { useCallback, useEffect, useMemo } from "react";
import { Configure, useSearchBox, useSortBy } from "react-instantsearch";
import { SearchBox } from "./SearchBox";
import {
  buildMeilisearchFilter,
  parseNaturalQuery,
  type ParsedNaturalQuery,
} from "../lib/parseNaturalQuery";

type SmartSearchBoxProps = {
  indexName: string;
  onParsedChange?: (parsed: ParsedNaturalQuery) => void;
};

function SortSync({
  indexName,
  sort,
}: {
  indexName: string;
  sort: ParsedNaturalQuery["sort"];
}) {
  const items = useMemo(
    () => [
      { label: "Relevance", value: indexName },
      { label: "Top rated", value: `${indexName}:vote_average:desc` },
      { label: "Newest first", value: `${indexName}:release_date:desc` },
      { label: "Oldest first", value: `${indexName}:release_date:asc` },
    ],
    [indexName],
  );
  const { refine, currentRefinement } = useSortBy({ items });

  useEffect(() => {
    const target =
      sort === "relevance"
        ? indexName
        : sort === "vote_average:desc"
          ? `${indexName}:vote_average:desc`
          : sort === "release_date:desc"
            ? `${indexName}:release_date:desc`
            : `${indexName}:release_date:asc`;

    if (currentRefinement !== target) {
      refine(target);
    }
  }, [sort, indexName, refine, currentRefinement]);

  return null;
}

function NaturalLanguageLayer({
  indexName,
  onParsedChange,
}: SmartSearchBoxProps) {
  const { query } = useSearchBox();
  const parsed = useMemo(() => parseNaturalQuery(query), [query]);
  const filters = useMemo(() => buildMeilisearchFilter(parsed), [parsed]);

  useEffect(() => {
    onParsedChange?.(parsed);
  }, [parsed, onParsedChange]);

  return (
    <>
      <Configure filters={filters} />
      <SortSync indexName={indexName} sort={parsed.sort} />
    </>
  );
}

export function SmartSearchBox({ indexName, onParsedChange }: SmartSearchBoxProps) {
  const queryHook = useCallback((query: string, search: (text: string) => void) => {
    search(parseNaturalQuery(query).searchText);
  }, []);

  return (
    <>
      <NaturalLanguageLayer
        indexName={indexName}
        onParsedChange={onParsedChange}
      />
      <SearchBox
        queryHook={queryHook}
        placeholder="Try: best indian action movie, top rated comedy…"
      />
    </>
  );
}
