/**
 * Generates src/data/eval-results.json from the eval harness writeup.
 *
 * The numbers shown on the site must come from a real eval run, not from
 * anything typed by hand. backend/eval/results.md is the artifact T17 produced,
 * but it lives outside the Next.js build context, so it is parsed here and the
 * result is committed. Re-run this after re-running the eval harness:
 *
 *   npm run sync:eval
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(here, "..");
const SOURCE = resolve(frontendRoot, "..", "backend", "eval", "results.md");
const OUTPUT = join(frontendRoot, "src", "data", "eval-results.json");

const SECTIONS = [
  { id: "overall", match: /^###\s+Overall Results/i, label: "All queries" },
  { id: "exact", match: /^###\s+Breakdown:\s*Exact-Term/i, label: "Exact-term queries" },
  {
    id: "paraphrase",
    match: /^###\s+Breakdown:\s*Paraphrase/i,
    label: "Paraphrase and semantic queries",
  },
];

function cleanCell(cell) {
  return cell.replace(/\*\*/g, "").trim();
}

/** True when a table cell was bolded, which the writeup uses to mark the best value. */
function isBest(cell) {
  return /\*\*.+\*\*/.test(cell.trim());
}

function parseTable(lines, startIndex) {
  const rows = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith("###") || line.startsWith("##")) break;
    if (!line.trim().startsWith("|")) {
      if (rows.length > 0) break;
      continue;
    }

    const cells = line.split("|").slice(1, -1);
    if (cells.length < 6) continue;

    const label = cleanCell(cells[0]);
    if (!label || /^-+$/.test(label) || /^Retrieval Mode$/i.test(label)) continue;

    const values = cells.slice(1, 6);
    if (!values.every((cell) => /^\**\d*\.?\d+\**$/.test(cell.trim()))) continue;

    rows.push({
      mode: label,
      metrics: {
        recall1: Number(cleanCell(values[0])),
        recall3: Number(cleanCell(values[1])),
        recall5: Number(cleanCell(values[2])),
        recall10: Number(cleanCell(values[3])),
        mrr: Number(cleanCell(values[4])),
      },
      best: {
        recall1: isBest(values[0]),
        recall3: isBest(values[1]),
        recall5: isBest(values[2]),
        recall10: isBest(values[3]),
        mrr: isBest(values[4]),
      },
    });
  }
  return rows;
}

function parseQueryCount(heading) {
  const match = heading.match(/\(\D*(\d+)\s+Quer/i);
  return match ? Number(match[1]) : null;
}

const markdown = await readFile(SOURCE, "utf8");
const lines = markdown.replace(/\r\n/g, "\n").split("\n");

const tables = [];
for (let i = 0; i < lines.length; i += 1) {
  const section = SECTIONS.find((candidate) => candidate.match.test(lines[i]));
  if (!section) continue;

  const rows = parseTable(lines, i + 1);
  if (rows.length === 0) {
    throw new Error(`No table rows parsed under heading: ${lines[i]}`);
  }

  tables.push({
    id: section.id,
    label: section.label,
    queryCount: parseQueryCount(lines[i]),
    rows,
  });
}

if (tables.length !== SECTIONS.length) {
  throw new Error(
    `Expected ${SECTIONS.length} result tables, parsed ${tables.length}. Has results.md changed shape?`,
  );
}

const payload = {
  generatedFrom: "backend/eval/results.md",
  generatedAt: new Date().toISOString(),
  evalSetSize: tables[0].queryCount,
  tables,
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(
  `Wrote ${OUTPUT} (${tables.length} tables, ${tables[0].rows.length} modes each).`,
);
