import type { Stanza } from "@/lib/types";

export type LanguageDetectionResult = {
  language: string;
  isEnglish: boolean;
  confidence: number;
  isMixed: boolean;
};

// Unicode ranges for non-Latin scripts
const NON_LATIN_REGEX =
  /[\u0900-\u097F\u0A00-\u0A7F\u0980-\u09FF\u0B00-\u0B7F\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0E00-\u0E7F\u0E80-\u0EFF\u1000-\u109F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0400-\u04FF\u1100-\u11FF]/;

export function containsNonLatinScript(text: string): boolean {
  return NON_LATIN_REGEX.test(text);
}

// Common English words for detection
const ENGLISH_MARKERS =
  /\b(the|and|is|are|was|were|have|has|had|been|will|would|could|should|can|do|does|did|not|but|for|with|this|that|from|they|you|she|her|his|him|our|your|its|all|out|about|just|into|than|then|them|some|when|what|which|who|how|each|make|like|long|look|many|come|over|such|take|only|very|know|say|want|give|most|also|back|after|work|where|well|even|here|must|between|need|mean|through|feel|right|think|call|keep|help|talk|turn|start|might|still|going|never|every|hear|last|always|both|those|once)\b/gi;

/**
 * Detect whether text is English, non-English, or mixed.
 * Uses heuristics: non-Latin script detection + English word frequency.
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { language: "en", isEnglish: true, confidence: 1, isMixed: false };
  }

  const totalChars = text.replace(/\s/g, "").length;
  if (totalChars === 0) {
    return { language: "en", isEnglish: true, confidence: 1, isMixed: false };
  }

  // Check for non-Latin characters
  const nonLatinGlobal = new RegExp(NON_LATIN_REGEX.source, "g");
  const nonLatinMatches = text.match(nonLatinGlobal);
  const nonLatinCount = nonLatinMatches ? nonLatinMatches.length : 0;
  const nonLatinRatio = nonLatinCount / totalChars;

  // Check English word frequency
  const englishMatches = text.match(ENGLISH_MARKERS);
  const englishWordCount = englishMatches ? englishMatches.length : 0;
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  const englishRatio = wordCount > 0 ? englishWordCount / wordCount : 0;

  // Strong non-Latin content → non-English
  if (nonLatinRatio > 0.3) {
    // Check if there's also significant English content → mixed
    if (englishRatio > 0.15) {
      return {
        language: "mixed",
        isEnglish: false,
        confidence: 0.8,
        isMixed: true,
      };
    }
    return {
      language: inferScriptLanguage(text),
      isEnglish: false,
      confidence: 0.9,
      isMixed: false,
    };
  }

  // Mostly Latin script — check English word ratio
  if (englishRatio > 0.3) {
    return { language: "en", isEnglish: true, confidence: 0.85, isMixed: false };
  }

  // Latin script but low English word ratio — likely a Romance/European language
  if (englishRatio < 0.1 && wordCount > 10) {
    return {
      language: "unknown",
      isEnglish: false,
      confidence: 0.6,
      isMixed: false,
    };
  }

  // Ambiguous — lean toward English for Latin script (per spec: prefer simpler path)
  return { language: "en", isEnglish: true, confidence: 0.5, isMixed: false };
}

/**
 * Classify each line in the stanzas as english or foreign.
 */
export function classifyLines(stanzas: Stanza[]): Stanza[] {
  return stanzas.map((stanza) => ({
    ...stanza,
    lines: stanza.lines.map((line) => {
      const text = line.original.trim();
      if (!text) {
        return { ...line, lineLanguage: "unknown" as const, needsTranslation: false };
      }

      const hasNonLatin = containsNonLatinScript(text);
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      const englishMatches = text.match(ENGLISH_MARKERS);
      const englishCount = englishMatches ? englishMatches.length : 0;
      const englishRatio = words.length > 0 ? englishCount / words.length : 0;

      if (hasNonLatin) {
        return { ...line, lineLanguage: "foreign" as const, needsTranslation: true };
      }

      if (englishRatio > 0.15 || (words.length <= 5 && englishRatio > 0)) {
        return { ...line, lineLanguage: "english" as const, needsTranslation: false };
      }

      // Latin-script but not clearly English — treat as foreign for translation
      if (words.length > 2 && englishRatio < 0.1) {
        return { ...line, lineLanguage: "foreign" as const, needsTranslation: true };
      }

      return { ...line, lineLanguage: "unknown" as const, needsTranslation: false };
    }),
  }));
}

function inferScriptLanguage(text: string): string {
  // Devanagari (Hindi, Marathi, Sanskrit, etc.)
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  // Gurmukhi (Punjabi)
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa";
  // Bengali
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  // Telugu
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  // Kannada
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  // Malayalam
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml";
  // Japanese (Hiragana/Katakana/Kanji)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)) return "ja";
  // Korean
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return "ko";
  // Arabic
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  // Hebrew
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  // Cyrillic (Russian, etc.)
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  // Chinese
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  // Thai
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  return "unknown";
}
