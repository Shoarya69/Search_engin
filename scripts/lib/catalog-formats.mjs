export function toMeiliBusinessDoc(fields) {
  return {
    id: fields.business_id || fields.id,
    name: fields.name,
    slug: fields.slug,
    city: fields.city ?? null,
    state: fields.state ?? null,
    country: fields.country ?? null,
    business_type: fields.business_type ?? null,
    category_labels: fields.category_labels ?? [],
    search_text: fields.search_text ?? "",
    is_live: Boolean(fields.is_live),
    pincode: fields.pincode ?? null,
  };
}

export function normalizeBusinessRow(row) {
  if (!row || typeof row !== "object") return null;
  if (row.kind === "product") return null;
  if (row.fields?.kind === "business") {
    return toMeiliBusinessDoc(row.fields);
  }
  if (row.kind === "business" && row.name != null) {
    return toMeiliBusinessDoc(row);
  }
  if (row.id && row.name != null && row.kind == null) {
    return toMeiliBusinessDoc(row);
  }
  return null;
}

function loadJsonlLines(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`Line ${i + 1}: invalid JSON`);
      }
    });
}

/** JSON array `[...]` or JSONL (one `{...}` per line). */
export function parseCatalogRaw(raw, inputPath = "input") {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`${inputPath}: empty file`);
  }
  if (trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error(`${inputPath}: expected JSON array`);
    }
    return { format: "json-array", rows: parsed };
  }
  if (trimmed.startsWith("{")) {
    return { format: "jsonl", rows: loadJsonlLines(raw) };
  }
  throw new Error(
    `${inputPath}: expected JSON array or JSONL (one JSON object per line)`,
  );
}

export function businessDocsFromRaw(raw, inputPath) {
  const { format, rows } = parseCatalogRaw(raw, inputPath);
  const docs = rows.map(normalizeBusinessRow).filter(Boolean);
  return { format, docs, rowCount: rows.length };
}
