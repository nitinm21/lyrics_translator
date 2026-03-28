import type { RecentSearch, SearchResult } from "@/lib/types";

const STORAGE_KEY = "lyrics-translator.recent-searches";
const SESSION_COOKIE_KEY = "lyrics-translator.session-searches";
const MAX_RECENT_SEARCHES = 6;
const MAX_COOKIE_SEARCHES = 3;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

type SessionCookieSearch = Pick<
  RecentSearch,
  "songId" | "title" | "artist" | "query"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSearchResultLike(value: unknown): value is SearchResult {
  return (
    isRecord(value) &&
    typeof value.songId === "string" &&
    typeof value.title === "string" &&
    typeof value.artist === "string" &&
    (typeof value.albumArtUrl === "string" || value.albumArtUrl === null) &&
    value.provider === "genius"
  );
}

function isRecentSearchLike(value: unknown): value is RecentSearch {
  return (
    isSearchResultLike(value) &&
    typeof (value as RecentSearch).query === "string" &&
    typeof (value as RecentSearch).visitedAt === "string"
  );
}

function isSessionCookieSearch(value: unknown): value is SessionCookieSearch {
  return (
    isRecord(value) &&
    typeof value.songId === "string" &&
    typeof value.title === "string" &&
    typeof value.artist === "string" &&
    typeof value.query === "string"
  );
}

export function parseRecentSearches(raw: string | null | undefined): RecentSearch[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentSearchLike).slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function toSessionCookieSearches(searches: RecentSearch[]): SessionCookieSearch[] {
  return searches.slice(0, MAX_COOKIE_SEARCHES).map((search) => ({
    songId: search.songId,
    title: search.title,
    artist: search.artist,
    query: search.query,
  }));
}

function fromSessionCookieSearches(searches: SessionCookieSearch[]): RecentSearch[] {
  return searches.map((search, index) => ({
    ...search,
    albumArtUrl: null,
    provider: "genius",
    visitedAt: new Date(Date.now() - index).toISOString(),
  }));
}

export function parseRecentSearchCookie(cookieHeader: string): RecentSearch[] {
  const cookieValue = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_KEY}=`))
    ?.slice(SESSION_COOKIE_KEY.length + 1);

  if (!cookieValue) return [];

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(cookieValue));
    if (!Array.isArray(parsed)) return [];
    const sessionSearches = parsed
      .filter(isSessionCookieSearch)
      .slice(0, MAX_COOKIE_SEARCHES);

    return fromSessionCookieSearches(sessionSearches);
  } catch {
    return [];
  }
}

export function mergeRecentSearch(
  existing: RecentSearch[],
  next: RecentSearch
): RecentSearch[] {
  return [next, ...existing.filter((search) => search.songId !== next.songId)].slice(
    0,
    MAX_RECENT_SEARCHES
  );
}

export function createRecentSearch(
  query: string,
  result: SearchResult,
  now = new Date()
): RecentSearch {
  return {
    ...result,
    query: query.trim(),
    visitedAt: now.toISOString(),
  };
}

export function readRecentSearches(
  storage: Pick<Storage, "getItem">,
  cookieHeader: string
): RecentSearch[] {
  let storedSearches: RecentSearch[] = [];

  try {
    storedSearches = parseRecentSearches(storage.getItem(STORAGE_KEY));
  } catch {
    storedSearches = [];
  }

  if (storedSearches.length > 0) return storedSearches;
  return parseRecentSearchCookie(cookieHeader);
}

export function saveRecentSearch(
  storage: StorageLike,
  cookieWriter: (value: string) => void,
  next: RecentSearch
): RecentSearch[] {
  let existingSearches: RecentSearch[] = [];

  try {
    existingSearches = parseRecentSearches(storage.getItem(STORAGE_KEY));
  } catch {
    existingSearches = [];
  }

  const merged = mergeRecentSearch(existingSearches, next);

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Cookie fallback still keeps the current session usable when storage is blocked.
  }

  cookieWriter(
    `${SESSION_COOKIE_KEY}=${encodeURIComponent(
      JSON.stringify(toSessionCookieSearches(merged))
    )}; path=/; SameSite=Lax`
  );

  return merged;
}
