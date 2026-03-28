"use client";

import Link from "next/link";
import type { RecentSearch } from "@/lib/types";

type Props = {
  searches: RecentSearch[];
  onSelect: () => void;
};

export function RecentSearches({ searches, onSelect }: Props) {
  if (searches.length === 0) return null;

  return (
    <div className="room-dropdown absolute top-full right-0 left-0 z-20 mt-3 overflow-hidden rounded-[24px]">
      <ul className="p-2 sm:p-3">
        {searches.map((search) => (
          <li key={search.songId}>
            <Link
              href={`/song/${search.songId}`}
              onClick={onSelect}
              className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/[0.8] text-secondary ring-1 ring-inset ring-white/[0.06]">
                <HistoryIcon />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium text-primary sm:text-[15px]">
                  {search.query}
                </span>
                <span className="mt-0.5 block truncate text-sm text-secondary">
                  {search.title} · {search.artist}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HistoryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
