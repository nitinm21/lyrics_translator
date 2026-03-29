"use client";

import Link from "next/link";
import Image from "next/image";

const FEATURED_SONGS = [
  {
    songId: "7967959",
    title: "Tití Me Preguntó",
    artist: "Bad Bunny",
    albumArtUrl:
      "https://images.genius.com/222b691d0481ad34fac9328c757028fc.300x300x1.png",
    language: "Spanish",
  },
  {
    songId: "62618",
    title: "Du hast",
    artist: "Rammstein",
    albumArtUrl:
      "https://images.genius.com/85ff59df2d3cc203524242393cfdd9d2.300x265x1.jpg",
    language: "German",
  },
  {
    songId: "88368",
    title: "Gangnam Style",
    artist: "PSY",
    albumArtUrl:
      "https://images.genius.com/68b1a06e56a9f46ac51ae3a0e88c3a3c.300x300x1.png",
    language: "Korean",
  },
];

export function FeaturedSongs() {
  return (
    <div className="mt-10 sm:mt-14">
      <div className="mb-5 flex items-center gap-3 sm:mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-divider" />
        <span className="text-xs tracking-[0.12em] uppercase text-secondary/70 select-none">
          or try one of these
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-divider" />
      </div>

      <div className="space-y-2.5">
        {FEATURED_SONGS.map((song, i) => (
          <Link
            key={song.songId}
            href={`/song/${song.songId}`}
            className="group relative flex items-center gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-all duration-200 hover:border-accent-1/20 hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(214,154,75,0.06)] active:scale-[0.995] sm:gap-4 sm:px-4 sm:py-3 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.3)] sm:h-12 sm:w-12">
              <Image
                src={song.albumArtUrl}
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[15px] font-medium leading-tight text-primary">
                {song.title}
              </p>
              <p className="mt-0.5 truncate text-sm leading-tight text-secondary">
                {song.artist}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] tracking-wide text-secondary/60">
              {song.language}
            </span>

            <svg
              className="shrink-0 text-secondary/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent-1/50"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 3.5L10.5 8L6 12.5" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
