/**
 * Turns a generated answer into renderable blocks.
 *
 * The backend returns the model's raw text. In practice that text is light
 * markdown (bold, inline code, bullet and numbered lists) with `[n]` citation
 * markers that index into the reranked context window. We parse it ourselves
 * rather than pulling in a markdown library, because the citation markers need
 * to become interactive elements rather than plain text, and because the
 * surface area we actually need to support is small and fixed.
 */

export type AnswerInline =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "emphasis"; value: string }
  | { kind: "code"; value: string }
  | { kind: "citation"; index: number; resolved: boolean };

export type AnswerBlock =
  | { kind: "paragraph"; content: AnswerInline[] }
  | { kind: "heading"; content: AnswerInline[] }
  | { kind: "list"; ordered: boolean; items: AnswerInline[][] };

export interface ParsedAnswer {
  blocks: AnswerBlock[];
  /** Citation indices that appear in the answer and resolve to a source. */
  citedIndices: number[];
  /**
   * Citation indices the model emitted with no matching source. Non-empty
   * means the answer and the evidence panel disagree, which the UI reports
   * rather than silently dropping.
   */
  unresolvedIndices: number[];
}

/** The exact refusal string the grounding prompt instructs the model to use. */
const REFUSAL = "I don't have enough information in the provided documents to answer this question.";

export function isRefusal(answer: string): boolean {
  const normalised = answer.trim().replace(/[""]/g, '"').replace(/['']/g, "'");
  return normalised.toLowerCase().startsWith(REFUSAL.toLowerCase().slice(0, 40));
}

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*|\[\d+\])/g;

function parseInline(source: string, validIndices: Set<number>, seen: Set<number>, missing: Set<number>): AnswerInline[] {
  const tokens: AnswerInline[] = [];
  let cursor = 0;

  for (const match of source.matchAll(INLINE_PATTERN)) {
    const start = match.index;
    if (start > cursor) {
      tokens.push({ kind: "text", value: source.slice(cursor, start) });
    }

    const raw = match[0];
    if (raw.startsWith("**")) {
      tokens.push({ kind: "strong", value: raw.slice(2, -2) });
    } else if (raw.startsWith("`")) {
      tokens.push({ kind: "code", value: raw.slice(1, -1) });
    } else if (raw.startsWith("[")) {
      const index = Number.parseInt(raw.slice(1, -1), 10);
      const resolved = validIndices.has(index);
      if (resolved) seen.add(index);
      else missing.add(index);
      tokens.push({ kind: "citation", index, resolved });
    } else {
      tokens.push({ kind: "emphasis", value: raw.slice(1, -1) });
    }

    cursor = start + raw.length;
  }

  if (cursor < source.length) {
    tokens.push({ kind: "text", value: source.slice(cursor) });
  }

  return tokens;
}

const BULLET_PATTERN = /^\s*[-*•]\s+/;
const ORDERED_PATTERN = /^\s*\d+[.)]\s+/;
const HEADING_PATTERN = /^\s*#{1,6}\s+/;

export function parseAnswer(answer: string, validIndices: Iterable<number>): ParsedAnswer {
  const valid = new Set(validIndices);
  const seen = new Set<number>();
  const missing = new Set<number>();

  const blocks: AnswerBlock[] = [];
  const lines = answer.replace(/\r\n/g, "\n").split("\n");

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (text) blocks.push({ kind: "paragraph", content: parseInline(text, valid, seen, missing) });
  };

  const flushList = () => {
    if (!list) return;
    const { ordered, items } = list;
    list = null;
    blocks.push({
      kind: "list",
      ordered,
      items: items.map((item) => parseInline(item, valid, seen, missing)),
    });
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (HEADING_PATTERN.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        content: parseInline(line.replace(HEADING_PATTERN, "").trim(), valid, seen, missing),
      });
      continue;
    }

    const isBullet = BULLET_PATTERN.test(line);
    const isOrdered = !isBullet && ORDERED_PATTERN.test(line);

    if (isBullet || isOrdered) {
      flushParagraph();
      const ordered = isOrdered;
      const item = line.replace(isBullet ? BULLET_PATTERN : ORDERED_PATTERN, "").trim();
      if (list && list.ordered === ordered) {
        list.items.push(item);
      } else {
        flushList();
        list = { ordered, items: [item] };
      }
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return {
    blocks,
    citedIndices: [...seen].sort((a, b) => a - b),
    unresolvedIndices: [...missing].sort((a, b) => a - b),
  };
}
