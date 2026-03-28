import { NextRequest, NextResponse } from "next/server";
import type { TranslationState } from "@/lib/types";
import { getGeniusSong } from "@/lib/providers/genius/song";
import { getCachedSong, cacheSong } from "@/lib/song-cache";
import { classifyLines } from "@/lib/language/detect-language";
import { transliterate } from "@/lib/providers/openai/transliterate";
import { translate } from "@/lib/providers/openai/translate";
import { getCached, setCache, getCacheKey } from "@/lib/cache";

type RouteContext = { params: Promise<{ songId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { songId } = await context.params;

  try {
    let song = getCachedSong(songId);
    if (!song) {
      song = await getGeniusSong(songId);
      cacheSong(song);
    }

    // English songs don't need translation
    if (song.isEnglish) {
      const state: TranslationState = {
        state: "not_needed",
        sourceLanguage: "en",
      };
      return NextResponse.json(state);
    }

    // Check cache
    const cacheKey = getCacheKey(songId, song.lyricsHash);
    const cached = getCached(cacheKey);
    if (cached) {
      const state: TranslationState = {
        state: "ready",
        sourceLanguage: cached.sourceLanguage,
        stanzas: mergeResults(cached.transliteration, cached.translation),
      };
      return NextResponse.json(state);
    }

    // Classify lines for mixed-language handling
    const classifiedStanzas = classifyLines(song.stanzas);

    // Run transliteration and translation in parallel
    const [transliterationResult, translationResult] = await Promise.all([
      transliterate(classifiedStanzas, song.sourceLanguage),
      translate(classifiedStanzas, song.sourceLanguage),
    ]);

    // Cache the results
    setCache(cacheKey, {
      transliteration: transliterationResult,
      translation: translationResult,
      sourceLanguage: song.sourceLanguage,
    });

    const state: TranslationState = {
      state: "ready",
      sourceLanguage: song.sourceLanguage,
      stanzas: mergeResults(transliterationResult, translationResult),
    };
    return NextResponse.json(state);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error("Translation error:", errMsg);
    if (errStack) console.error(errStack);
    const state: TranslationState = {
      state: "error",
      message: `Translation failed: ${errMsg}`,
    };
    return NextResponse.json(state, { status: 500 });
  }
}

/**
 * Merge transliteration and translation results into a single stanza array.
 */
function mergeResults(
  transliteration: { stanzaId: string; lines: { lineId: string; mode: string; transliteration?: string }[] }[],
  translation: { stanzaId: string; lines: { lineId: string; mode: string; translation?: string }[] }[]
) {
  const translitMap = new Map<string, Map<string, string>>();
  for (const s of transliteration) {
    const lineMap = new Map<string, string>();
    for (const l of s.lines) {
      if (l.transliteration) lineMap.set(l.lineId, l.transliteration);
    }
    translitMap.set(s.stanzaId, lineMap);
  }

  return translation.map((stanza) => ({
    stanzaId: stanza.stanzaId,
    lines: stanza.lines.map((line) => ({
      lineId: line.lineId,
      mode: line.mode as "translated" | "unchanged",
      transliteration: translitMap.get(stanza.stanzaId)?.get(line.lineId),
      translation: line.translation,
    })),
  }));
}
