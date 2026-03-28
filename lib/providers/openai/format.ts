import type { Stanza } from "@/lib/types";

/**
 * Format stanzas into numbered text for LLM input.
 */
export function formatStanzasForLLM(
  stanzas: Stanza[],
  onlyForeign: boolean
): string {
  const parts: string[] = [];

  for (const stanza of stanzas) {
    const lines = onlyForeign
      ? stanza.lines.filter((l) => l.needsTranslation !== false)
      : stanza.lines;

    if (lines.length === 0) continue;

    const lineTexts = lines.map(
      (l) => `  ${l.lineId}: ${l.original}`
    );
    parts.push(`${stanza.stanzaId}:\n${lineTexts.join("\n")}`);
  }

  return parts.join("\n\n");
}

export type LLMStanzaResult = {
  stanzaId: string;
  lines: Array<{
    lineId: string;
    text: string;
  }>;
};

/**
 * Extract stanza results from LLM JSON response.
 * Flexible: handles various key names and structures the LLM might return.
 */
export function parseLLMResponse(raw: string): LLMStanzaResult[] | null {
  try {
    const parsed = JSON.parse(raw);

    // Try to find the array of stanzas in various locations
    const candidates = [
      parsed,                    // direct array
      parsed.stanzas,            // { stanzas: [...] }
      parsed.result,             // { result: [...] }
      parsed.data,               // { data: [...] }
      parsed.translations,       // { translations: [...] }
      parsed.transliterations,   // { transliterations: [...] }
    ];

    // Also check if the object itself has stanzaId keys (single stanza)
    if (parsed.stanzaId) {
      candidates.push([parsed]);
    }

    // Try to find first value that's an array
    if (!candidates.some(Array.isArray)) {
      const values = Object.values(parsed);
      for (const v of values) {
        if (Array.isArray(v)) candidates.push(v);
      }
    }

    for (const candidate of candidates) {
      if (!Array.isArray(candidate) || candidate.length === 0) continue;

      const normalized = normalizeStanzaArray(candidate);
      if (normalized) return normalized;
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeStanzaArray(arr: unknown[]): LLMStanzaResult[] | null {
  const results: LLMStanzaResult[] = [];

  for (const item of arr) {
    if (typeof item !== "object" || item === null) return null;

    const obj = item as Record<string, unknown>;
    const stanzaId = obj.stanzaId ?? obj.stanza_id ?? obj.id;
    if (typeof stanzaId !== "string") return null;

    const lines = obj.lines;
    if (!Array.isArray(lines)) return null;

    const normalizedLines: Array<{ lineId: string; text: string }> = [];
    for (const line of lines) {
      if (typeof line !== "object" || line === null) return null;
      const lineObj = line as Record<string, unknown>;

      const lineId = lineObj.lineId ?? lineObj.line_id ?? lineObj.id;
      if (typeof lineId !== "string") return null;

      // Accept text under various key names
      const text =
        lineObj.text ??
        lineObj.translation ??
        lineObj.transliteration ??
        lineObj.romanization ??
        lineObj.pronunciation ??
        lineObj.content;
      if (typeof text !== "string") return null;

      normalizedLines.push({ lineId: lineId as string, text: text as string });
    }

    results.push({ stanzaId: stanzaId as string, lines: normalizedLines });
  }

  return results.length > 0 ? results : null;
}
