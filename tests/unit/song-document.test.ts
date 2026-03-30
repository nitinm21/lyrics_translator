import { describe, expect, it } from "vitest";
import { buildSongDocument } from "@/lib/song-document";
import type { SongMetadata } from "@/lib/types";

describe("buildSongDocument", () => {
  it("falls back to provider metadata when language detection returns unknown", () => {
    const metadata: SongMetadata = {
      songId: "7967959",
      provider: "genius",
      title: "Tití Me Preguntó",
      artist: "Bad Bunny",
      albumArtUrl: null,
      sourceLanguage: "es",
    };

    const song = buildSongDocument(
      metadata,
      "Tití me preguntó si tengo muchas novia'\nMuchas novia', hoy tengo a una, mañana otra"
    );

    expect(song.sourceLanguage).toBe("es");
    expect(song.isEnglish).toBe(false);
  });
});
