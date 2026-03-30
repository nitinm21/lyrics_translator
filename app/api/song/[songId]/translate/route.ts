import { NextRequest, NextResponse } from "next/server";
import type { SongDocument, TranslationState } from "@/lib/types";
import { cacheSong } from "@/lib/song-cache";
import { classifyLines } from "@/lib/language/detect-language";
import { transliterate } from "@/lib/providers/openai/transliterate";
import { translate } from "@/lib/providers/openai/translate";
import { getCached, getCacheKey, setCache } from "@/lib/cache";
import {
  trackTranslationComplete,
  trackTranslationError,
  trackTranslationStart,
} from "@/lib/analytics";

type RouteContext = { params: Promise<{ songId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { songId } = await context.params;

  try {
    const body = (await request.json()) as { song?: unknown };
    const song = body.song;

    if (!isSongDocument(song)) {
      return NextResponse.json(
        { state: "error", message: "Translation failed: Invalid song payload." },
        { status: 400 }
      );
    }

    if (song.songId !== songId) {
      return NextResponse.json(
        { state: "error", message: "Translation failed: Song ID mismatch." },
        { status: 400 }
      );
    }

    cacheSong(song);

    if (song.isEnglish) {
      const state: TranslationState = {
        state: "not_needed",
        sourceLanguage: "en",
      };
      return NextResponse.json(state);
    }

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

    const classifiedStanzas = classifyLines(song.stanzas);

    trackTranslationStart(songId, song.sourceLanguage);
    const translationStartTime = Date.now();

    const transliterationResult = await transliterate(
      classifiedStanzas,
      song.sourceLanguage
    );
    const translationResult = await translate(
      classifiedStanzas,
      song.sourceLanguage
    );

    setCache(cacheKey, {
      transliteration: transliterationResult,
      translation: translationResult,
      sourceLanguage: song.sourceLanguage,
    });

    trackTranslationComplete(
      songId,
      song.sourceLanguage,
      Date.now() - translationStartTime
    );

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
    const errorDetails = describeErrorForLog(error);
    if (errorDetails) {
      console.error("Translation error detail:", errorDetails);
    }
    if (errStack) console.error(errStack);
    trackTranslationError(songId, errMsg);
    const state: TranslationState = {
      state: "error",
      message: `Translation failed: ${errMsg}`,
    };
    return NextResponse.json(state, { status: 500 });
  }
}

function mergeResults(
  transliteration: {
    stanzaId: string;
    lines: { lineId: string; mode: string; transliteration?: string }[];
  }[],
  translation: {
    stanzaId: string;
    lines: { lineId: string; mode: string; translation?: string }[];
  }[]
) {
  const translitMap = new Map<string, Map<string, string>>();
  for (const stanza of transliteration) {
    const lineMap = new Map<string, string>();
    for (const line of stanza.lines) {
      if (line.transliteration) lineMap.set(line.lineId, line.transliteration);
    }
    translitMap.set(stanza.stanzaId, lineMap);
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

function isSongDocument(value: unknown): value is SongDocument {
  if (!value || typeof value !== "object") {
    return false;
  }

  const song = value as Partial<SongDocument>;

  return (
    typeof song.songId === "string" &&
    song.provider === "genius" &&
    typeof song.title === "string" &&
    typeof song.artist === "string" &&
    (song.albumArtUrl === null || typeof song.albumArtUrl === "string") &&
    typeof song.sourceLanguage === "string" &&
    typeof song.isEnglish === "boolean" &&
    typeof song.lyricsHash === "string" &&
    Array.isArray(song.stanzas)
  );
}

function describeErrorForLog(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const cause = error.cause;
  if (!(cause instanceof Error)) {
    return null;
  }

  const causeStatus = Reflect.get(cause, "status");
  const status =
    typeof causeStatus === "number" ? ` status=${String(causeStatus)}` : "";
  return `${cause.name}: ${cause.message}${status}`;
}
