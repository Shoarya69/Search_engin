import type { Hit } from "instantsearch.js";
import type { CatalogBusiness } from "../types/catalog";

type CatalogHitProps = {
  hit: Hit<CatalogBusiness>;
};

export function CatalogHit({ hit }: CatalogHitProps) {
  const location = [hit.city, hit.state].filter(Boolean).join(", ");
  const categories = hit.category_labels ?? [];

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 transition hover:border-accent/40">
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-base font-semibold leading-snug"
          dangerouslySetInnerHTML={{
            __html:
              (hit._highlightResult?.name as { value?: string } | undefined)
                ?.value ?? hit.name,
          }}
        />
        {hit.is_live && (
          <span className="shrink-0 rounded-md bg-emerald-600/20 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-300">
            Live
          </span>
        )}
      </div>
      {hit.business_type && (
        <p className="text-xs text-accent">{hit.business_type}</p>
      )}
      {location && (
        <p className="text-sm text-text-muted">{location}</p>
      )}
      {categories.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {categories.slice(0, 4).map((c) => (
            <li
              key={c}
              className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
