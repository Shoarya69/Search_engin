import type { SemanticSearchParse } from "../lib/nlp/types";

type QueryIntentChipsProps = {
  parsed: SemanticSearchParse;
  nlpMode: string;
};

export function QueryIntentChips({ parsed, nlpMode }: QueryIntentChipsProps) {
  if (parsed.chips.length === 0 && parsed.sources.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {parsed.sources.length > 0 && (
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
          NLP: {nlpMode} ({parsed.sources.join(" + ")})
        </span>
      )}
      {parsed.chips.length > 0 && (
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Understood as
        </span>
      )}
      {parsed.chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-ink"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
