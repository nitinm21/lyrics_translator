"use client";

import Link from "next/link";
import Image from "next/image";
import type { SearchResult } from "@/lib/types";

type Props = {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  searched: boolean;
  onResultSelect?: (result: SearchResult) => void;
};

export function SearchResults({
  results,
  loading,
  error,
  searched,
  onResultSelect,
}: Props) {
  if (loading) return <SearchSkeletons />;

  if (error) {
    return (
      <div className="rounded-xl border border-accent-1/20 bg-surface px-5 py-4 text-sm text-accent-1">
        {error}
      </div>
    );
  }

  if (searched && results.length === 0) {
    return (
      <div className="py-8 text-center text-secondary">
        <p className="text-lg font-medium">No results found</p>
        <p className="mt-1 text-sm">Try a different song title or artist name.</p>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <ul className="space-y-3">
      {results.map((result, i) => (
        <li
          key={result.songId}
          className="animate-fade-in-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Link
            href={`/song/${result.songId}`}
            onClick={() => onResultSelect?.(result)}
            className="flex items-center gap-3 rounded-xl border border-divider bg-surface px-3 py-3 transition-all hover:shadow-md hover:border-accent-1/20 active:scale-[0.99] sm:gap-4 sm:px-4"
          >
            {result.albumArtUrl ? (
              <Image
                src={result.albumArtUrl}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-divider text-secondary/40">
                <MusicIcon />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-primary">
                {result.title}
              </p>
              <p className="truncate text-sm text-secondary">{result.artist}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SearchSkeletons() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-xl border border-divider bg-surface px-3 py-3 sm:gap-4 sm:px-4"
        >
          <div className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-divider" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-divider" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-divider" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MusicIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
