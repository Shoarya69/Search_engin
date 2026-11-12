import { useEffect, useRef, useState } from "react";
import { Configure, useSearchBox } from "react-instantsearch";
import type { ClientEnv } from "../config/env";
import { resolveQuery } from "../lib/nlp/resolveQuery";
import type { SemanticSearchParse } from "../lib/nlp/types";
import { SearchBox } from "./SearchBox";

type SmartSearchBoxProps = {
  env: ClientEnv;
  onParsedChange?: (parsed: SemanticSearchParse) => void;
};

const MIN_WORDS = 3;
const WORD_DEBOUNCE_MS = 400;

const EMPTY_PARSE: SemanticSearchParse = {
  searchText: "",
  facetFilters: [],
  sort: "relevance",
  chips: [],
  sources: [],
};

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function SmartSearchBox({ env, onParsedChange }: SmartSearchBoxProps) {
  const { refine, clear } = useSearchBox();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<SemanticSearchParse>(EMPTY_PARSE);
  const debounceRef = useRef<number | null>(null);
  const requestRef = useRef(0);
  const onParsedChangeRef = useRef(onParsedChange);
  onParsedChangeRef.current = onParsedChange;

  useEffect(() => {
    onParsedChangeRef.current?.(parsed);
  }, [parsed]);

  useEffect(() => {
    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    };
  }, []);

  function cancelDebounce() {
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }

  function onValueChange(value: string) {
    setText(value);
    cancelDebounce();
    requestRef.current += 1;
    setParsed(EMPTY_PARSE);

    const trimmed = value.trim();
    if (!trimmed) {
      clear();
      return;
    }
    if (wordCount(trimmed) < MIN_WORDS) return;

    debounceRef.current = window.setTimeout(() => {
      refine(trimmed);
    }, WORD_DEBOUNCE_MS);
  }

  async function onSubmit() {
    cancelDebounce();
    const trimmed = text.trim();
    if (!trimmed) {
      clear();
      setParsed(EMPTY_PARSE);
      return;
    }

    const requestId = ++requestRef.current;
    const result = await resolveQuery(trimmed, {
      mode: env.nlpMode,
      profile: env.dataProfile,
      glinerApiUrl: env.nlpMode === "rules" ? undefined : env.nlpApiUrl,
    });
    if (requestId !== requestRef.current) return;

    setParsed(result);
    refine((result.searchText || trimmed).trim());
  }

  const placeholder =
    env.dataProfile === "catalog"
      ? "Type 3 words, or press Enter…"
      : "Type 3 words, or press Enter…";

  return (
    <>
      <Configure facetFilters={parsed.facetFilters} />
      <SearchBox
        value={text}
        onValueChange={onValueChange}
        onSubmit={() => {
          void onSubmit();
        }}
        placeholder={placeholder}
      />
    </>
  );
}
