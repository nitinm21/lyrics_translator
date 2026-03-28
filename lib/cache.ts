import type { TranslationStanzaResult } from "@/lib/types";

type CacheEntry = {
  transliteration: TranslationStanzaResult[];
  translation: TranslationStanzaResult[];
  sourceLanguage: string;
  timestamp: number;
};

// In-memory cache keyed by songId:lyricsHash
const cache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export function getCacheKey(songId: string, lyricsHash: string): string {
  return `${songId}:${lyricsHash}`;
}

export function getCached(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setCache(key: string, entry: Omit<CacheEntry, "timestamp">): void {
  cache.set(key, { ...entry, timestamp: Date.now() });
}
