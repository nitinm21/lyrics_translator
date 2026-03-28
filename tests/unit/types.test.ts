import { describe, it, expect } from "vitest";
import type { SongDocument, SearchResult, TranslationState } from "@/lib/types";

describe("domain types", () => {
  it("SongDocument shape is valid", () => {
    const doc: SongDocument = {
      songId: "123",
      provider: "genius",
      title: "Test Song",
      artist: "Test Artist",
      albumArtUrl: null,
      sourceLanguage: "en",
      isEnglish: true,
      lyricsHash: "abc",
      stanzas: [
        {
          stanzaId: "s-1",
          sectionLabel: "Verse 1",
          lines: [
            { lineId: "s-1-l-1", original: "Hello world" },
          ],
        },
      ],
    };
    expect(doc.stanzas).toHaveLength(1);
    expect(doc.stanzas[0].lines[0].original).toBe("Hello world");
  });

  it("SearchResult shape is valid", () => {
    const result: SearchResult = {
      songId: "456",
      title: "Another Song",
      artist: "Another Artist",
      albumArtUrl: "https://example.com/art.jpg",
      provider: "genius",
    };
    expect(result.provider).toBe("genius");
  });

  it("TranslationState discriminated union works", () => {
    const notNeeded: TranslationState = { state: "not_needed", sourceLanguage: "en" };
    const pending: TranslationState = { state: "pending" };
    const ready: TranslationState = {
      state: "ready",
      sourceLanguage: "ja",
      stanzas: [
        {
          stanzaId: "s-1",
          lines: [
            { lineId: "s-1-l-1", mode: "translated", translation: "Hello" },
          ],
        },
      ],
    };
    const error: TranslationState = { state: "error", message: "Something went wrong" };

    expect(notNeeded.state).toBe("not_needed");
    expect(pending.state).toBe("pending");
    expect(ready.state).toBe("ready");
    expect(error.state).toBe("error");
  });
});
