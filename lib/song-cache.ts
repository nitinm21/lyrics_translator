import type { SongDocument } from "@/lib/types";

const songCache = new Map<string, { song: SongDocument; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

export function getCachedSong(songId: string): SongDocument | null {
  const entry = songCache.get(songId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    songCache.delete(songId);
    return null;
  }
  return entry.song;
}

export function cacheSong(song: SongDocument): void {
  songCache.set(song.songId, { song, timestamp: Date.now() });
}
