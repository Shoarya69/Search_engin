import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { businessDocsFromRaw } from "./lib/catalog-formats.mjs";

const input =
  process.argv[2] ||
  process.env.CATALOG_JSONL_PATH ||
  process.env.CATALOG_INPUT_PATH ||
  resolve(process.cwd(), "../real_doc/search-documents.jsonl");
const output =
  process.argv[3] ||
  process.env.CATALOG_JSON_PATH ||
  resolve(process.cwd(), "catalog-data.json");

async function main() {
  const raw = await readFile(input, "utf8");
  const { format, docs, rowCount } = businessDocsFromRaw(raw, input);

  if (docs.length === 0) {
    throw new Error(
      `No business rows in ${input} (${format}, ${rowCount} lines).`,
    );
  }

  await writeFile(output, JSON.stringify(docs, null, 2));
  const skipped = rowCount - docs.length;
  console.log(
    `Wrote ${docs.length} businesses (${format}) → ${output}` +
      (skipped > 0 ? ` (skipped ${skipped} non-business rows)` : ""),
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
