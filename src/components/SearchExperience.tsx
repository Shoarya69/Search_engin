import { Configure, InstantSearch } from "react-instantsearch";
import type { SearchClient } from "instantsearch.js";
import type { ClientEnv } from "../config/env";
import { createSearchClient } from "../lib/searchClient";
import { SearchBox } from "./SearchBox";
import { GenreRefinement } from "./GenreRefinement";
import { SortBy } from "./SortBy";
import { StatsAndPagination } from "./StatsAndPagination";
import { HitsGrid } from "./HitsGrid";

type SearchExperienceProps = {
  env: ClientEnv;
};

export function SearchExperience({ env }: SearchExperienceProps) {
  const { searchClient } = createSearchClient(env);

  return (
    <InstantSearch
      searchClient={searchClient as unknown as SearchClient}
      indexName={env.indexName}
    >
      <Configure hitsPerPage={16} />
      <div className="space-y-8">
        <div className="relative max-w-3xl">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <SearchBox />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <div className="hidden w-full shrink-0 lg:block lg:w-56 xl:w-64">
            <GenreRefinement />
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="lg:hidden">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Filter by genre
                </p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-surface-elevated p-3">
                  <GenreRefinement />
                </div>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-sm text-text-muted">Sort</span>
                <SortBy indexName={env.indexName} />
              </div>
            </div>

            <StatsAndPagination />
            <HitsGrid />
            <StatsAndPagination />
          </div>
        </div>
      </div>
    </InstantSearch>
  );
}
