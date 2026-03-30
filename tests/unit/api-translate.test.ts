import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SongDocument, TranslationState } from "@/lib/types";

// Mock dependencies
vi.mock("@/lib/providers/genius/song", () => ({
  getGeniusSong: vi.fn(),
}));
vi.mock("@/lib/song-cache", () => ({
  getCachedSong: vi.fn(),
  cacheSong: vi.fn(),
}));
vi.mock("@/lib/language/detect-language", () => ({
  classifyLines: vi.fn((stanzas) => stanzas),
}));
vi.mock("@/lib/providers/openai/transliterate", () => ({
  transliterate: vi.fn(),
}));
vi.mock("@/lib/providers/openai/translate", () => ({
  translate: vi.fn(),
}));
vi.mock("@/lib/cache", () => ({
  getCacheKey: vi.fn((id, hash) => `${id}:${hash}`),
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

import { getCachedSong } from "@/lib/song-cache";
import { classifyLines } from "@/lib/language/detect-language";
import { transliterate } from "@/lib/providers/openai/transliterate";
import { translate } from "@/lib/providers/openai/translate";
import { getCached, setCache } from "@/lib/cache";

const mockGetCachedSong = vi.mocked(getCachedSong);
const mockTransliterate = vi.mocked(transliterate);
const mockTranslate = vi.mocked(translate);
const mockGetCached = vi.mocked(getCached);
const mockSetCache = vi.mocked(setCache);

function makeEnglishSong(): SongDocument {
  return {
    songId: "100",
    provider: "genius",
    title: "English Song",
    artist: "Artist",
    albumArtUrl: null,
    sourceLanguage: "en",
    isEnglish: true,
    lyricsHash: "abc123",
    stanzas: [
      { stanzaId: "s-1", lines: [{ lineId: "s-1-l-1", original: "Hello world" }] },
    ],
  };
}

function makeJapaneseSong(): SongDocument {
  return {
    songId: "200",
    provider: "genius",
    title: "Japanese Song",
    artist: "Artist",
    albumArtUrl: null,
    sourceLanguage: "ja",
    isEnglish: false,
    lyricsHash: "def456",
    stanzas: [
      { stanzaId: "s-1", lines: [{ lineId: "s-1-l-1", original: "桜の花が咲く" }] },
    ],
  };
}

// Simulate the translate route handler logic
async function handleTranslateRequest(song: SongDocument): Promise<{ status: number; body: TranslationState }> {
  if (song.isEnglish) {
    return { status: 200, body: { state: "not_needed", sourceLanguage: "en" } };
  }

  const cacheKey = `${song.songId}:${song.lyricsHash}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return {
      status: 200,
      body: {
        state: "ready",
        sourceLanguage: cached.sourceLanguage,
        stanzas: [], // simplified
      },
    };
  }

  try {
    const classified = classifyLines(song.stanzas);
    const transliterationResult = await transliterate(classified, song.sourceLanguage);
    const translationResult = await translate(classified, song.sourceLanguage);

    setCache(cacheKey, {
      transliteration: transliterationResult,
      translation: translationResult,
      sourceLanguage: song.sourceLanguage,
    });

    return {
      status: 200,
      body: {
        state: "ready",
        sourceLanguage: song.sourceLanguage,
        stanzas: translationResult,
      },
    };
  } catch (error) {
    return {
      status: 500,
      body: { state: "error", message: `Translation failed: ${error instanceof Error ? error.message : String(error)}` },
    };
  }
}

describe("translate route logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_needed for English songs", async () => {
    const song = makeEnglishSong();
    const response = await handleTranslateRequest(song);
    expect(response.body.state).toBe("not_needed");
    expect(mockTranslate).not.toHaveBeenCalled();
    expect(mockTransliterate).not.toHaveBeenCalled();
  });

  it("returns cached result when available", async () => {
    const song = makeJapaneseSong();
    mockGetCached.mockReturnValue({
      transliteration: [],
      translation: [],
      sourceLanguage: "ja",
      timestamp: Date.now(),
    });

    const response = await handleTranslateRequest(song);
    expect(response.body.state).toBe("ready");
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it("runs translation pipeline for non-English songs", async () => {
    const song = makeJapaneseSong();
    mockGetCached.mockReturnValue(null);
    mockTransliterate.mockResolvedValue([
      { stanzaId: "s-1", lines: [{ lineId: "s-1-l-1", mode: "translated" as const, transliteration: "sakura no hana" }] },
    ]);
    mockTranslate.mockResolvedValue([
      { stanzaId: "s-1", lines: [{ lineId: "s-1-l-1", mode: "translated" as const, translation: "Cherry blossoms bloom" }] },
    ]);

    const response = await handleTranslateRequest(song);
    expect(response.body.state).toBe("ready");
    expect(mockTransliterate).toHaveBeenCalledOnce();
    expect(mockTranslate).toHaveBeenCalledOnce();
    expect(mockSetCache).toHaveBeenCalledOnce();
  });

  it("returns error state on translation failure", async () => {
    const song = makeJapaneseSong();
    mockGetCached.mockReturnValue(null);
    mockTransliterate.mockRejectedValue(new Error("OpenAI rate limit"));
    mockTranslate.mockResolvedValue([]);

    const response = await handleTranslateRequest(song);
    expect(response.status).toBe(500);
    expect(response.body.state).toBe("error");
    expect(response.body).toHaveProperty("message");
  });

  it("caches successful results", async () => {
    const song = makeJapaneseSong();
    mockGetCached.mockReturnValue(null);
    mockTransliterate.mockResolvedValue([]);
    mockTranslate.mockResolvedValue([]);

    await handleTranslateRequest(song);
    expect(mockSetCache).toHaveBeenCalledWith(
      `${song.songId}:${song.lyricsHash}`,
      expect.objectContaining({ sourceLanguage: "ja" })
    );
  });
});
