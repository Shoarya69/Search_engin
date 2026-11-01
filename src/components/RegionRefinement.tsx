import { RefinementList } from "react-instantsearch";

const REGION_LABELS: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  FR: "France",
  JP: "Japan",
  KR: "South Korea",
  DE: "Germany",
};

export function RegionRefinement() {
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        Region
      </h2>
      <RefinementList
        attribute="origin_regions"
        limit={8}
        showMore
        showMoreLimit={20}
        sortBy={["count:desc"]}
        transformItems={(items) =>
          items.map((item) => ({
            ...item,
            label: REGION_LABELS[item.label] ?? item.label,
          }))
        }
        classNames={{
          root: "space-y-1",
          list: "max-h-48 space-y-0.5 overflow-y-auto pr-1",
          item: "flex items-center",
          label:
            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-text-muted transition hover:bg-surface-elevated hover:text-white",
          checkbox:
            "h-4 w-4 shrink-0 rounded border-border bg-surface accent-accent",
          labelText: "truncate",
          count:
            "ml-auto shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-xs tabular-nums text-text-muted",
          showMore:
            "mt-2 w-full rounded-lg py-2 text-xs font-medium text-accent hover:bg-surface-elevated",
        }}
      />
    </div>
  );
}
