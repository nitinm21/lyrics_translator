// ---------------------------------------------------------------------------
// Domain types for Lyrics Translator
// ---------------------------------------------------------------------------

/** A single lyric line within a stanza. */
export type LyricLine = {
  lineId: string;
  original: string;
  lineLanguage?: "english" | "foreign" | "unknown";
  needsTranslation?: boolean;
  transliteration?: string;
  translation?: string;
};

/** A group of lyric lines separated by blank lines in the source text. */
export type Stanza = {
  stanzaId: string;
  sectionLabel?: string | null;
  lines: LyricLine[];
};

/** The normalized, provider-agnostic song document used throughout the app. */
export type SongDocument = {
  songId: string;
  provider: "genius";
  title: string;
  artist: string;
  albumArtUrl: string | null;
  sourceLanguage: string;
  isEnglish: boolean;
  lyricsHash: string;
  stanzas: Stanza[];
};

/** Song metadata returned before lyrics are normalized into a document. */
export type SongMetadata = {
  songId: string;
  provider: "genius";
  title: string;
  artist: string;
  albumArtUrl: string | null;
  sourceLanguage?: string;
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export type SearchResult = {
  songId: string;
  title: string;
  artist: string;
  albumArtUrl: string | null;
  provider: "genius";
};

export type RecentSearch = SearchResult & {
  query: string;
  visitedAt: string;
};

// ---------------------------------------------------------------------------
// Translation state — returned by /api/song/[songId]/translate
// ---------------------------------------------------------------------------

export type TranslationLineResult = {
  lineId: string;
  mode: "translated" | "unchanged";
  transliteration?: string;
  translation?: string;
};

export type TranslationStanzaResult = {
  stanzaId: string;
  lines: TranslationLineResult[];
};

export type TranslationState =
  | { state: "not_needed"; sourceLanguage: "en" }
  | { state: "pending" }
  | {
      state: "ready";
      sourceLanguage: string;
      stanzas: TranslationStanzaResult[];
    }
  | { state: "error"; message: string };

// ---------------------------------------------------------------------------
// Provider interfaces
// ---------------------------------------------------------------------------

export interface SearchProvider {
  search(query: string): Promise<SearchResult[]>;
}

export interface SongProvider {
  getSong(songId: string): Promise<SongDocument>;
}

export interface TranslationProvider {
  transliterate(
    stanzas: Stanza[],
    sourceLanguage: string
  ): Promise<TranslationStanzaResult[]>;
  translate(
    stanzas: Stanza[],
    sourceLanguage: string
  ): Promise<TranslationStanzaResult[]>;
}
