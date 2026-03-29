"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SearchResults } from "./search-results";
import { RecentSearches } from "./recent-searches";
import {
  createRecentSearch,
  readRecentSearches,
  saveRecentSearch,
} from "@/lib/search-history";
import type { SearchResult, RecentSearch } from "@/lib/types";

export function SearchShell() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.results);
      }
    } catch {
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setRecentSearches(readRecentSearches(window.localStorage, document.cookie));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    debounceRef.current = setTimeout(() => performSearch(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch(query);
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setInputFocused(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      const nextSearch = createRecentSearch(trimmedQuery, result);
      const merged = saveRecentSearch(
        window.localStorage,
        (cookie) => {
          document.cookie = cookie;
        },
        nextSearch
      );

      setRecentSearches(merged);
      setInputFocused(false);
    },
    [query]
  );

  const showRecentSearches = inputFocused && !query.trim() && recentSearches.length > 0;

  return (
    <div ref={shellRef} className="w-full">
      <form onSubmit={handleSubmit} className="relative" role="search">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setInputFocused(false);
            }
          }}
          placeholder="Search for a song or artist..."
          aria-label="Search for a song or artist"
          className="room-input w-full rounded-[20px] px-4 py-3.5 text-base text-primary placeholder:text-secondary/60 transition-shadow focus:outline-none sm:px-5 sm:py-4 sm:text-lg"
        />
        {showRecentSearches ? (
          <RecentSearches
            searches={recentSearches}
            onSelect={() => setInputFocused(false)}
          />
        ) : null}
      </form>
      <div className="mt-6">
        <SearchResults
          results={results}
          loading={loading}
          error={error}
          searched={searched}
          onResultSelect={handleResultSelect}
        />
      </div>
    </div>
  );
}
