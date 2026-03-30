import type { Stanza, TranslationStanzaResult } from "@/lib/types";
import { getOpenAIClient, wrapOpenAIError } from "./client";
import { buildTranslationPrompt } from "@/lib/prompts/translate";
import { runLyricsTask } from "./run-lyrics-task";

export async function translate(
  stanzas: Stanza[],
  sourceLanguage: string
): Promise<TranslationStanzaResult[]> {
  const client = getOpenAIClient();

  try {
    const results = await runLyricsTask({
      client,
      stanzas,
      sourceLanguage,
      taskLabel: "Translation",
      buildPrompt: buildTranslationPrompt,
    });
    return mergeTranslationResults(stanzas, results);
  } catch (error) {
    throw wrapOpenAIError(error);
  }
}

function mergeTranslationResults(
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
      const translation = resultMap.get(stanza.stanzaId)?.get(line.lineId);
      if (translation) {
        return {
          lineId: line.lineId,
          mode: "translated" as const,
          translation,
        };
      }
      return {
        lineId: line.lineId,
        mode: "unchanged" as const,
      };
    }),
  }));
}
