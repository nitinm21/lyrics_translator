import type { Stanza, TranslationStanzaResult } from "@/lib/types";
import { getOpenAIClient, wrapOpenAIError } from "./client";
import { buildTransliterationPrompt } from "@/lib/prompts/transliterate";
import { runLyricsTask } from "./run-lyrics-task";
import { containsNonLatinScript } from "@/lib/language/detect-language";

export async function transliterate(
  stanzas: Stanza[],
  sourceLanguage: string
): Promise<TranslationStanzaResult[]> {
  const client = getOpenAIClient();

  try {
    const results = await runLyricsTask({
      client,
      stanzas,
      sourceLanguage,
      taskLabel: "Transliteration",
      buildPrompt: buildTransliterationPrompt,
      onlyForeign: false,
    });
    return mergeTransliterationResults(stanzas, results);
  } catch (error) {
    throw wrapOpenAIError(error);
  }
}

function mergeTransliterationResults(
  stanzas: Stanza[],
  llmResults: Array<{ stanzaId: string; lines: Array<{ lineId: string; text: string }> }>
): TranslationStanzaResult[] {
  const resultMap = new Map<string, Map<string, string>>();
  for (const s of llmResults) {
    const lineMap = resultMap.get(s.stanzaId) ?? new Map<string, string>();
    for (const l of s.lines) {
      lineMap.set(l.lineId, l.text);
    }
    resultMap.set(s.stanzaId, lineMap);
  }

  return stanzas.map((stanza) => ({
    stanzaId: stanza.stanzaId,
    lines: stanza.lines.map((line) => {
      const transliteration =
        resultMap.get(stanza.stanzaId)?.get(line.lineId) ??
        fallbackLatinTransliteration(line.original);

      if (transliteration) {
        return {
          lineId: line.lineId,
          mode: "translated" as const,
          transliteration,
        };
      }
      return {
        lineId: line.lineId,
        mode: "unchanged" as const,
      };
    }),
  }));
}

function fallbackLatinTransliteration(original: string): string | undefined {
  const trimmed = original.trim();
  if (!trimmed || containsNonLatinScript(trimmed)) {
    return undefined;
  }

  return trimmed;
}
