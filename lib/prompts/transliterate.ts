export function buildTransliterationPrompt(
  sourceLanguage: string,
  numberedLyrics: string
): string {
  return `You are a precise transliteration assistant specializing in song lyrics.

Given the following ${sourceLanguage} song lyrics (numbered by stanza ID and line ID), produce a romanized pronunciation guide for each line.

Rules:
- Preserve the exact stanza IDs and line IDs in your output
- Transliterate each line into Latin script pronunciation
- Keep proper nouns and already-romanized words as-is
- Do not translate — only transliterate for pronunciation
- Return ONLY valid JSON, no other text

Input lyrics:
${numberedLyrics}

Return a JSON array with this exact structure:
[
  {
    "stanzaId": "s-1",
    "lines": [
      { "lineId": "s-1-l-1", "text": "romanized pronunciation here" }
    ]
  }
]`;
}
