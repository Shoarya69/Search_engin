type SearchErrorProps = {
  message: string;
};

export function SearchError({ message }: SearchErrorProps) {
  const isInvalidKey = /invalid.*api key/i.test(message);

  return (
    <div className="col-span-full rounded-2xl border border-accent/40 bg-accent/10 px-6 py-8">
      <p className="text-lg font-medium text-ink">Search failed</p>
      <p className="mt-2 text-sm text-text-muted">{message}</p>
      {isInvalidKey && (
        <p className="mt-4 text-sm text-text-muted">
          Local Meilisearch: <code className="text-ink">VITE_MEILISEARCH_SEARCH_API_KEY</code>{" "}
          must match the key on port 7700 (often same as{" "}
          <code className="text-ink">MEILISEARCH_MASTER_API_KEY</code>). Fix{" "}
          <code className="text-ink">.env</code>, then restart{" "}
          <code className="text-ink">npm run dev</code>.
        </p>
      )}
    </div>
  );
}
