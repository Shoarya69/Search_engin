import type { SearchEngine } from "../config/env";

type EnvErrorProps = {
  missing: string[];
  engine: SearchEngine | null;
};

export function EnvError({ missing, engine }: EnvErrorProps) {
  const engineLabel =
    engine === "opensearch" ? "OpenSearch" : "Meilisearch";

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-border bg-surface-elevated p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-white">
          Configuration required
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Copy{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-accent">
            .env.example
          </code>{" "}
          to{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 text-accent">
            .env
          </code>{" "}
          and set <strong className="text-white">{engineLabel}</strong> for{" "}
          <code className="text-white">VITE_SEARCH_ENGINE={engine ?? "meilisearch"}</code>.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-text-muted">
          {missing.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <code className="text-white">{key}</code>
            </li>
          ))}
        </ul>
        {engine === "opensearch" && (
          <p className="mt-6 text-xs text-text-muted">
            OpenSearch without security: set only{" "}
            <code className="text-white">VITE_OPENSEARCH_URL</code>. No API key
            or username/password needed. npm scripts use{" "}
            <code className="text-white">OPENSEARCH_URL</code>.
          </p>
        )}
        {engine === "meilisearch" && (
          <p className="mt-6 text-xs text-text-muted">
            Use a search-only API key for{" "}
            <code className="text-white">VITE_MEILISEARCH_SEARCH_API_KEY</code>.
          </p>
        )}
      </div>
    </div>
  );
}
