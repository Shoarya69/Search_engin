import type { SearchEngine } from "../config/env";

type AppShellProps = {
  children: React.ReactNode;
  engine: SearchEngine;
};

const ENGINE_LABEL: Record<SearchEngine, string> = {
  meilisearch: "Meilisearch",
  opensearch: "OpenSearch",
};

export function AppShell({ children, engine }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface-elevated/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-white"
            aria-hidden
          >
            M
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
              Movie Search
            </h1>
            <p className="text-xs text-text-muted sm:text-sm">
              Powered by {ENGINE_LABEL[engine]}
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
