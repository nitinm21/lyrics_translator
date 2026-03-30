import type OpenAI from "openai";
import type { Stanza } from "@/lib/types";
import { createLyricBatches } from "./batching";
import { formatStanzasForLLM, parseLLMResponse, type LLMStanzaResult } from "./format";

type RunLyricsTaskOptions = {
  client: OpenAI;
  stanzas: Stanza[];
  sourceLanguage: string;
  taskLabel: string;
  buildPrompt: (sourceLanguage: string, numberedLyrics: string) => string;
  onlyForeign?: boolean;
};

export async function runLyricsTask({
  client,
  stanzas,
  sourceLanguage,
  taskLabel,
  buildPrompt,
  onlyForeign = true,
}: RunLyricsTaskOptions): Promise<LLMStanzaResult[]> {
  const batches = createLyricBatches(stanzas, onlyForeign);
  if (batches.length === 0) {
    return [];
  }

  const results: LLMStanzaResult[] = [];

  for (const batch of batches) {
    const numberedLyrics = formatStanzasForLLM(batch, false);
    if (!numberedLyrics.trim()) {
      continue;
    }

    const prompt = buildPrompt(sourceLanguage, numberedLyrics);
    const batchResults = await requestLyricsBatch(client, prompt, taskLabel);
    results.push(...batchResults);
  }

  return results;
}

async function requestLyricsBatch(
  client: OpenAI,
  prompt: string,
  taskLabel: string
): Promise<LLMStanzaResult[]> {
  let lastContent: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      continue;
    }

    lastContent = content;
    const validated = parseLLMResponse(content);
    if (validated) {
      return validated;
    }
  }

  console.error(
    `${taskLabel} LLM response could not be parsed:`,
    lastContent?.slice(0, 500)
  );
  throw new Error(`${taskLabel} returned an unexpected format. Please try again.`);
}
