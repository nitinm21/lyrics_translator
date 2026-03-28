import type { Stanza, TranslationStanzaResult } from "@/lib/types";
import { getOpenAIClient } from "./client";
import { formatStanzasForLLM, parseLLMResponse } from "./format";
import { buildTransliterationPrompt } from "@/lib/prompts/transliterate";

export async function transliterate(
  stanzas: Stanza[],
  sourceLanguage: string
): Promise<TranslationStanzaResult[]> {
  const client = getOpenAIClient();
  const numberedLyrics = formatStanzasForLLM(stanzas, true);

  if (!numberedLyrics.trim()) {
    return [];
  }

  const prompt = buildTransliterationPrompt(sourceLanguage, numberedLyrics);
  let lastContent: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) continue;
    lastContent = content;

    const validated = parseLLMResponse(content);
    if (validated) {
      return mergeTransliterationResults(stanzas, validated);
    }
  }

  console.error("Transliteration LLM response could not be parsed:", lastContent?.slice(0, 500));
  throw new Error("Failed to get valid transliteration after retries");
}

function mergeTransliterationResults(
  stanzas: Stanza[],
  llmResults: Array<{ stanzaId: string; lines: Array<{ lineId: string; text: string }> }>
): TranslationStanzaResult[] {
  const resultMap = new Map<string, Map<string, string>>();
  for (const s of llmResults) {
    const lineMap = new Map<string, string>();
    for (const l of s.lines) {
      lineMap.set(l.lineId, l.text);
    }
    resultMap.set(s.stanzaId, lineMap);
  }

  return stanzas.map((stanza) => ({
    stanzaId: stanza.stanzaId,
    lines: stanza.lines.map((line) => {
      const transliteration = resultMap.get(stanza.stanzaId)?.get(line.lineId);
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
