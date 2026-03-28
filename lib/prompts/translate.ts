export function buildTranslationPrompt(
  sourceLanguage: string,
  numberedLyrics: string
): string {
  return `You are a skilled literary translator specializing in song lyrics.

Translate the following ${sourceLanguage} song lyrics into natural, emotionally faithful English.

Rules:
- Preserve the exact stanza IDs and line IDs in your output
- Prefer idiomatic, emotionally resonant English over literal word-for-word translation
- Preserve the poetic feel and emotional tone of the original
- Do not add editorial commentary or extra lines
- If a line is primarily a proper noun, ad-lib, or vocalization, keep it close to the original
- Return ONLY valid JSON, no other text

Input lyrics:
${numberedLyrics}

Return a JSON array with this exact structure:
[
  {
    "stanzaId": "s-1",
    "lines": [
      { "lineId": "s-1-l-1", "text": "English translation here" }
    ]
  }
]`;
}
