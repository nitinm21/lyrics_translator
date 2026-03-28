import Image from "next/image";
import type { SongDocument, TranslationState } from "@/lib/types";

type Props = {
  song: SongDocument;
  translationState?: TranslationState;
};

export function SongHero({ song, translationState }: Props) {
  const showStatusRow =
    song.isEnglish ||
    translationState?.state === "pending" ||
    translationState?.state === "error";

  return (
    <div className="flex items-start gap-4 sm:gap-6 md:gap-8">
      {song.albumArtUrl ? (
        <Image
          src={song.albumArtUrl}
          alt={`${song.title} album art`}
          width={176}
          height={176}
          className="h-24 w-24 shrink-0 rounded-lg object-cover shadow-md sm:h-32 sm:w-32 md:h-44 md:w-44"
          priority
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-divider text-secondary/40 sm:h-32 sm:w-32 md:h-44 md:w-44">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sm:h-12 sm:w-12">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}
      <div className="min-w-0 pt-0.5 sm:pt-1 md:pt-2">
        <h1 className="font-serif text-2xl font-normal leading-tight tracking-[0.012em] text-primary sm:text-3xl md:text-5xl">
          {song.title}
        </h1>
        <p className="mt-1.5 text-base tracking-[-0.015em] text-secondary sm:mt-2 sm:text-lg md:text-xl">
          {song.artist}
        </p>
        {showStatusRow ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
            <TranslationBadge state={translationState} isEnglish={song.isEnglish} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TranslationBadge({
  state,
  isEnglish,
}: {
  state?: TranslationState;
  isEnglish: boolean;
}) {
  if (isEnglish) {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-secondary sm:px-3 sm:py-1 sm:text-xs">
        Original English lyrics
      </span>
    );
  }

  if (!state) return null;

  switch (state.state) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-1/10 px-2.5 py-0.5 text-[11px] font-medium text-accent-1 sm:px-3 sm:py-1 sm:text-xs">
          <span className="inline-flex h-3 items-end gap-0.5 text-accent-1/80" aria-hidden="true">
            <span className="animate-wait-bar h-1.5 w-0.5 rounded-full bg-current" />
            <span
              className="animate-wait-bar h-2.5 w-0.5 rounded-full bg-current"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="animate-wait-bar h-2 w-0.5 rounded-full bg-current"
              style={{ animationDelay: "0.3s" }}
            />
          </span>
          Translating&hellip;
        </span>
      );
    case "ready":
      return null;
    case "error":
      return (
        <span className="inline-flex items-center rounded-full bg-red-800/10 px-2.5 py-0.5 text-[11px] font-medium text-red-800 sm:px-3 sm:py-1 sm:text-xs">
          Translation failed
        </span>
      );
    default:
      return null;
  }
}
