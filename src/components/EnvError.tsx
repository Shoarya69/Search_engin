type EnvErrorProps = {
  missing: string[];
};

export function EnvError({ missing }: EnvErrorProps) {
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
          and set your Meilisearch Cloud credentials.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-text-muted">
          {missing.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <code className="text-white">{key}</code>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-text-muted">
          Use a search-only API key for{" "}
          <code className="text-white">VITE_MEILISEARCH_SEARCH_API_KEY</code>.
          Never put the master key in a{" "}
          <code className="text-white">VITE_</code> variable.
        </p>
      </div>
    </div>
  );
}
