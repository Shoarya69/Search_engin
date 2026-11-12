import type { NerEntity } from "./types";

export async function fetchGlinerEntities(
  query: string,
  apiUrl: string,
  signal?: AbortSignal,
): Promise<NerEntity[]> {
  const base = apiUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`GLiNER API error ${response.status}`);
  }

  const data = (await response.json()) as { entities?: NerEntity[] };
  return data.entities ?? [];
}
