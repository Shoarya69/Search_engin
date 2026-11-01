import type { ParsedNaturalQuery } from "../lib/parseNaturalQuery";

const SORT_LABELS: Record<ParsedNaturalQuery["sort"], string | null> = {
  relevance: null,
  "vote_average:desc": "Top rated",
  "release_date:desc": "Newest",
  "release_date:asc": "Oldest",
};

type QueryIntentChipsProps = {
  parsed: ParsedNaturalQuery;
};

export function QueryIntentChips({ parsed }: QueryIntentChipsProps) {
  const chips: string[] = [];

  for (const g of parsed.genres) chips.push(g);
  for (const r of parsed.originRegions) {
    chips.push(r === "IN" ? "India / Bollywood" : r);
  }
  for (const l of parsed.languages) chips.push(`Language: ${l}`);
  const sortLabel = SORT_LABELS[parsed.sort];
  if (sortLabel) chips.push(sortLabel);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Understood as
      </span>
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-white"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
