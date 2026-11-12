import { useEffect, useId, useState } from "react";
import type { Hit } from "instantsearch.js";
import { useInstantSearch } from "react-instantsearch";
import type { CatalogBusiness } from "../types/catalog";

type CatalogHitProps = {
  hit: Hit<CatalogBusiness>;
};

function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 2);
}

function productMatches(label: string, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const haystack = label.toLowerCase();
  return tokens.some((token) => haystack.includes(token));
}

export function CatalogHit({ hit }: CatalogHitProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const { indexUiState } = useInstantSearch();
  const tokens = queryTokens(indexUiState.query ?? "");
  const products = hit.category_labels ?? [];
  const matched = products.filter((label) => productMatches(label, tokens));
  const location = [hit.city, hit.state].filter(Boolean).join(", ");
  const preview = (matched.length > 0 ? matched : products).slice(0, 3);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-full w-full flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 text-left shadow-sm transition hover:border-accent/40 hover:shadow-md"
      >
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
            <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-700">
              Live
            </span>
          )}
        </div>
        {hit.business_type && (
          <p className="text-xs font-medium text-accent">{hit.business_type}</p>
        )}
        {location && <p className="text-sm text-text-muted">{location}</p>}
        <div className="mt-auto space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {products.length === 1 ? "1 product" : `${products.length} products`}
          </p>
          {preview.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {preview.map((product) => (
                <li
                  key={product}
                  className={
                    productMatches(product, tokens)
                      ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-ink"
                      : "rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted"
                  }
                >
                  {product}
                </li>
              ))}
              {products.length > preview.length && (
                <li className="rounded-full px-1 py-0.5 text-xs text-text-muted">
                  +{products.length - preview.length}
                </li>
              )}
            </ul>
          )}
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(32rem,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-xl"
          >
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id={titleId} className="text-lg font-semibold">
                    {hit.name}
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {[hit.business_type, location, hit.pincode]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-1 text-sm text-text-muted hover:bg-surface hover:text-ink"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Products
              </h3>
              {products.length === 0 ? (
                <p className="mt-3 text-sm text-text-muted">
                  This business has no products listed.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {products.map((product) => {
                    const hitMatch = productMatches(product, tokens);
                    return (
                      <li
                        key={product}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm"
                      >
                        <span className={hitMatch ? "font-medium" : undefined}>
                          {product}
                        </span>
                        {hitMatch && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase text-ink">
                            Match
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
