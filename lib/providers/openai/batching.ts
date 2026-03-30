import type { Stanza } from "@/lib/types";

const MAX_BATCH_LINES = 24;
const MAX_BATCH_CHARS = 2_400;

export function createLyricBatches(
  stanzas: Stanza[],
  onlyForeign: boolean
): Stanza[][] {
  const preparedStanzas = stanzas.flatMap((stanza) =>
    splitOversizedStanza(
      {
        ...stanza,
        lines: onlyForeign
          ? stanza.lines.filter((line) => line.needsTranslation !== false)
          : stanza.lines,
      },
      MAX_BATCH_LINES,
      MAX_BATCH_CHARS
    )
  );

  if (preparedStanzas.length === 0) {
    return [];
  }

  const batches: Stanza[][] = [];
  let currentBatch: Stanza[] = [];
  let currentLineCount = 0;
  let currentCharCount = 0;

  for (const stanza of preparedStanzas) {
    if (stanza.lines.length === 0) {
      continue;
    }

    const stanzaLineCount = stanza.lines.length;
    const stanzaCharCount = estimateStanzaSize(stanza);
    const wouldOverflow =
      currentBatch.length > 0 &&
      (currentLineCount + stanzaLineCount > MAX_BATCH_LINES ||
        currentCharCount + stanzaCharCount > MAX_BATCH_CHARS);

    if (wouldOverflow) {
      batches.push(currentBatch);
      currentBatch = [];
      currentLineCount = 0;
      currentCharCount = 0;
    }

    currentBatch.push(stanza);
    currentLineCount += stanzaLineCount;
    currentCharCount += stanzaCharCount;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

function splitOversizedStanza(
  stanza: Stanza,
  maxLines: number,
  maxChars: number
): Stanza[] {
  if (stanza.lines.length === 0) {
    return [];
  }

  const chunks: Stanza[] = [];
  let currentLines: Stanza["lines"] = [];
  let currentCharCount = 0;

  for (const line of stanza.lines) {
    const lineSize = estimateLineSize(line.lineId, line.original);
    const wouldOverflow =
      currentLines.length > 0 &&
      (currentLines.length + 1 > maxLines ||
        currentCharCount + lineSize > maxChars);

    if (wouldOverflow) {
      chunks.push({ ...stanza, lines: currentLines });
      currentLines = [];
      currentCharCount = 0;
    }

    currentLines.push(line);
    currentCharCount += lineSize;
  }

  if (currentLines.length > 0) {
    chunks.push({ ...stanza, lines: currentLines });
  }

  return chunks;
}

function estimateStanzaSize(stanza: Stanza): number {
  return stanza.lines.reduce(
    (total, line) => total + estimateLineSize(line.lineId, line.original),
    stanza.stanzaId.length + (stanza.sectionLabel?.length ?? 0)
  );
}

function estimateLineSize(lineId: string, original: string): number {
  return lineId.length + original.length + 8;
}
