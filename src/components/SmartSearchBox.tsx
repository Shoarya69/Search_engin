import { useCallback, useEffect, useRef, useState } from "react";
import { Configure, useSearchBox } from "react-instantsearch";
import type { ClientEnv } from "../config/env";
import { resolveQuery } from "../lib/nlp/resolveQuery";
import type { SemanticSearchParse } from "../lib/nlp/types";
import { SearchBox } from "./SearchBox";

type SmartSearchBoxProps = {
  env: ClientEnv;
  indexName: string;
  onParsedChange?: (parsed: SemanticSearchParse) => void;
};

function NaturalLanguageLayer({
  env,
  onParsedChange,
  onSearchText,
}: SmartSearchBoxProps & {
  onSearchText: (engineText: string, rawQuery: string) => void;
}) {
  const { query } = useSearchBox();
  const [parsed, setParsed] = useState<SemanticSearchParse>({
    searchText: "",
    facetFilters: [],
    sort: "relevance",
    chips: [],
    sources: [],
  });
  const abortRef = useRef<AbortController | null>(null);
  const lastResolvedQueryRef = useRef<string | null>(null);
  const onParsedChangeRef = useRef(onParsedChange);
  const onSearchTextRef = useRef(onSearchText);
  onParsedChangeRef.current = onParsedChange;
  onSearchTextRef.current = onSearchText;

  useEffect(() => {
    lastResolvedQueryRef.current = null;
  }, [env.nlpMode, env.dataProfile, env.nlpApiUrl]);

  useEffect(() => {
    onParsedChangeRef.current?.(parsed);
  }, [parsed]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      lastResolvedQueryRef.current = null;
      setParsed({
        searchText: "",
        facetFilters: [],
        sort: "relevance",
        chips: [],
        sources: [],
      });
      onSearchTextRef.current("", "");
      return;
    }

    if (lastResolvedQueryRef.current === trimmed) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = window.setTimeout(() => {
      void resolveQuery(trimmed, {
        mode: env.nlpMode,
        profile: env.dataProfile,
        glinerApiUrl:
          env.nlpMode === "rules" ? undefined : env.nlpApiUrl,
        signal: controller.signal,
      }).then((result) => {
        if (controller.signal.aborted) return;
        if (query.trim() !== trimmed) return;
        lastResolvedQueryRef.current = trimmed;
        setParsed(result);
        const engineText = result.searchText.trim() || trimmed;
        onSearchTextRef.current(engineText, trimmed);
      });
    }, env.nlpMode === "rules" ? 0 : 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, env.nlpMode, env.dataProfile, env.nlpApiUrl]);

  return (
    <>
      <Configure facetFilters={parsed.facetFilters} />
    </>
  );
}

export function SmartSearchBox(props: SmartSearchBoxProps) {
  const searchTextRef = useRef("");
  const nlpReadyForRef = useRef<string | null>(null);

  const handleNlpSearchText = useCallback(
    (engineText: string, rawQuery: string) => {
      searchTextRef.current = engineText;
      nlpReadyForRef.current = rawQuery;
    },
    [],
  );

  const queryHook = useCallback((q: string, search: (value: string) => void) => {
    const trimmed = q.trim();
    if (!trimmed) {
      searchTextRef.current = "";
      nlpReadyForRef.current = null;
      search("");
      return;
    }
    if (nlpReadyForRef.current === trimmed) {
      search(searchTextRef.current || trimmed);
      return;
    }
    search(trimmed);
  }, []);

  const placeholder =
    props.env.dataProfile === "catalog"
      ? "Try: laptop shop in Jodhpur Rajasthan…"
      : "Try: best indian action movie, top rated comedy…";

  return (
    <>
      <NaturalLanguageLayer {...props} onSearchText={handleNlpSearchText} />
      <SearchBox queryHook={queryHook} placeholder={placeholder} />
    </>
  );
}
