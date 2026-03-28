"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SearchResults } from "./search-results";
import type { SearchResult } from "@/lib/types";

export function SearchShell() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

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

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a song or artist..."
          className="w-full rounded-xl border border-divider bg-surface px-4 py-3.5 text-base text-primary placeholder:text-secondary/60 shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-accent-1/30 sm:px-5 sm:py-4 sm:text-lg"
          autoFocus
        />
      </form>
      <div className="mt-6">
        <SearchResults
          results={results}
          loading={loading}
          error={error}
          searched={searched}
        />
      </div>
    </div>
  );
}
