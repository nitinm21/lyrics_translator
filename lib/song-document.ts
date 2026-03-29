import { detectLanguage } from "@/lib/language/detect-language";
import { computeLyricsHash, normalizeLyrics } from "@/lib/lyrics/normalize-lyrics";
import type { SongDocument, SongMetadata } from "@/lib/types";

export function buildSongDocument(
  metadata: SongMetadata,
  rawLyrics: string
): SongDocument {
  const stanzas = normalizeLyrics(rawLyrics);
  const lyricsHash = computeLyricsHash(rawLyrics);
  const langResult = detectLanguage(rawLyrics);

  return {
    songId: metadata.songId,
    provider: metadata.provider,
    title: metadata.title,
    artist: metadata.artist,
    albumArtUrl: metadata.albumArtUrl,
    sourceLanguage: langResult.language || metadata.sourceLanguage || "unknown",
    isEnglish: langResult.isEnglish,
    lyricsHash,
    stanzas,
  };
}
