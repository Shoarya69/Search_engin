import { SearchBox as InstantSearchBox } from "react-instantsearch";

type SearchBoxProps = {
  queryHook?: (query: string, search: (value: string) => void) => void;
  placeholder?: string;
};

export function SearchBox({
  queryHook,
  placeholder = "Search movies by title, plot, or genre…",
}: SearchBoxProps) {
  return (
    <InstantSearchBox
      queryHook={queryHook}
      placeholder={placeholder}
      classNames={{
        root: "w-full",
        form: "relative",
        input:
          "w-full rounded-xl border border-border bg-surface-elevated py-3.5 pl-12 pr-4 text-base text-ink placeholder:text-text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30",
        submit: "hidden",
        reset:
          "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface hover:text-ink",
        loadingIndicator: "absolute right-12 top-1/2 -translate-y-1/2",
      }}
      submitIconComponent={() => null}
      resetIconComponent={() => (
        <span aria-hidden className="text-sm">
          Clear
        </span>
      )}
    />
  );
}
