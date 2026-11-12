import { RefinementList } from "react-instantsearch";

function FacetList({
  title,
  attribute,
}: {
  title: string;
  attribute: string;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      <RefinementList
        attribute={attribute}
        limit={8}
        showMore
        showMoreLimit={24}
        classNames={{
          list: "max-h-40 space-y-0.5 overflow-y-auto",
          label:
            "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-text-muted hover:bg-surface-elevated hover:text-white",
          checkbox: "accent-accent",
          count: "ml-auto text-xs tabular-nums text-text-muted",
        }}
      />
    </div>
  );
}

export function CatalogRefinements() {
  return (
  <>
      <FacetList title="City" attribute="city" />
      <FacetList title="State" attribute="state" />
      <FacetList title="Category" attribute="category_labels" />
      <FacetList title="Business type" attribute="business_type" />
  </>
  );
}
