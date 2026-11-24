import type { SearchEngine } from "../config/env";
import type { DataProfile } from "../lib/nlp/types";

type AppShellProps = {
  children: React.ReactNode;
  engine: SearchEngine;
  dataProfile: DataProfile;
};

const ENGINE_LABEL: Record<SearchEngine, string> = {
  meilisearch: "Meilisearch",
  opensearch: "OpenSearch",
};

export function AppShell({ children, engine, dataProfile }: AppShellProps) {
  const catalog = dataProfile === "catalog";
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface-elevated">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-white"
            aria-hidden
          >
            C
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              {catalog ? "Catalog Search" : "Movie Search"}
            </h1>
            <p className="text-xs text-text-muted sm:text-sm">
              {catalog
                ? "Businesses, with the products they carry"
                : `Powered by ${ENGINE_LABEL[engine]}`}
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
