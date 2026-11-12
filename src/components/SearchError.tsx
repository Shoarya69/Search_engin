type SearchErrorProps = {
  message: string;
};

export function SearchError({ message }: SearchErrorProps) {
  const isInvalidKey = /invalid.*api key/i.test(message);

  return (
    <div className="col-span-full rounded-2xl border border-accent/40 bg-accent/10 px-6 py-8">
      <p className="text-lg font-medium text-white">Search failed</p>
      <p className="mt-2 text-sm text-text-muted">{message}</p>
      {isInvalidKey && (
        <p className="mt-4 text-sm text-text-muted">
          Local Meilisearch: <code className="text-white">VITE_MEILISEARCH_SEARCH_API_KEY</code>{" "}
          must match the key on port 7700 (often same as{" "}
          <code className="text-white">MEILISEARCH_MASTER_API_KEY</code>). Fix{" "}
          <code className="text-white">.env</code>, then restart{" "}
          <code className="text-white">npm run dev</code>.
        </p>
      )}
    </div>
  );
}
