type SearchBoxProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
};

export function SearchBox({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Search movies by title, plot, or genre…",
}: SearchBoxProps) {
  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label="Search"
        onChange={(event) => onValueChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-surface-elevated py-3.5 pl-12 pr-16 text-base text-ink placeholder:text-text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface hover:text-ink"
        >
          Clear
        </button>
      )}
    </form>
  );
}
