import { describe, expect, it } from "vitest";
import {
  createRecentSearch,
  mergeRecentSearch,
  parseRecentSearchCookie,
  parseRecentSearches,
  readRecentSearches,
  saveRecentSearch,
} from "@/lib/search-history";
import type { SearchResult } from "@/lib/types";

const baseResult: SearchResult = {
  songId: "123",
  title: "Numb",
  artist: "Linkin Park",
  albumArtUrl: "https://images.example/numb.jpg",
  provider: "genius",
};

function createStorage(initialValue: string | null = null) {
  const store = new Map<string, string>();
  if (initialValue !== null) {
    store.set("lyrics-translator.recent-searches", initialValue);
  }

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("search history", () => {
  it("parses valid local history entries", () => {
    const recentSearch = createRecentSearch("numb", baseResult, new Date("2026-03-28T12:00:00Z"));
    const parsed = parseRecentSearches(JSON.stringify([recentSearch]));

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.query).toBe("numb");
  });

  it("deduplicates recent entries by song id", () => {
    const olderSearch = createRecentSearch("numb", baseResult, new Date("2026-03-28T12:00:00Z"));
    const updatedResult: SearchResult = {
      ...baseResult,
      title: "Numb / Encore",
    };
    const newerSearch = createRecentSearch(
      "numb encore",
      updatedResult,
      new Date("2026-03-28T13:00:00Z")
    );

    const merged = mergeRecentSearch([olderSearch], newerSearch);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.title).toBe("Numb / Encore");
    expect(merged[0]?.query).toBe("numb encore");
  });

  it("falls back to session cookie history when local storage is empty", () => {
    const cookieValue = encodeURIComponent(
      JSON.stringify([
        {
          songId: "456",
          title: "Hips Don't Lie",
          artist: "Shakira",
          query: "shakira hips don't lie",
        },
      ])
    );

    const searches = readRecentSearches(
      createStorage(),
      `lyrics-translator.session-searches=${cookieValue}; path=/`
    );

    expect(searches).toHaveLength(1);
    expect(searches[0]?.songId).toBe("456");
    expect(searches[0]?.albumArtUrl).toBeNull();
  });

  it("writes merged history to local storage and session cookie", () => {
    const storage = createStorage();
    const nextSearch = createRecentSearch("numb", baseResult, new Date("2026-03-28T12:00:00Z"));
    let writtenCookie = "";

    const merged = saveRecentSearch(storage, (cookie) => {
      writtenCookie = cookie;
    }, nextSearch);

    expect(merged).toHaveLength(1);
    expect(parseRecentSearches(storage.getItem("lyrics-translator.recent-searches"))).toHaveLength(1);
    expect(parseRecentSearchCookie(writtenCookie)[0]?.query).toBe("numb");
  });
});
