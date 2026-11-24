/**
 * Write Vespa-style JSONL from catalog-data.json (array or JSONL).
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { businessDocsFromRaw } from "./lib/catalog-formats.mjs";

const input =
  process.argv[2] ||
  process.env.CATALOG_JSON_PATH ||
  resolve(process.cwd(), "catalog-data.json");
const output =
  process.argv[3] ||
  process.env.CATALOG_JSONL_PATH ||
  resolve(process.cwd(), "../real_doc/search-documents.jsonl");

function toVespaLine(doc) {
  const city = doc.city ?? null;
  const state = doc.state ?? null;
  const country = doc.country ?? "India";
  const fields = {
    business_id: doc.id,
    kind: "business",
    name: doc.name,
    slug: doc.slug,
    city,
    state,
    country,
    business_type: doc.business_type ?? null,
    category_labels: doc.category_labels ?? [],
    category_ids: [],
    is_live: Boolean(doc.is_live),
    pincode: doc.pincode ?? null,
    search_text: doc.search_text ?? "",
    city_norm: city ? String(city).trim().toLowerCase() : null,
    semantic_text: doc.search_text || doc.name,
  };

  return JSON.stringify({
    put: `id:catalog:business::${doc.id}`,
    fields,
  });
}

async function main() {
  const raw = await readFile(input, "utf8");
  const { docs, format } = businessDocsFromRaw(raw, input);

  await mkdir(dirname(output), { recursive: true });
  const lines = docs.map(toVespaLine).join("\n") + "\n";
  await writeFile(output, lines, "utf8");

  console.log(
    `Wrote ${docs.length} business lines (${format}) → ${output}\n(from ${input})`,
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
