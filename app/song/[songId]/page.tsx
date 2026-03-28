"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SongHero } from "@/components/song/song-hero";
import { LyricsReader } from "@/components/song/lyrics-reader";
import { OriginalLyricsPane } from "@/components/song/original-lyrics-pane";
import { TranslationLoadingState } from "@/components/song/translation-loading-state";
import type { SongDocument, TranslationState } from "@/lib/types";

export default function SongPage() {
  const { songId } = useParams<{ songId: string }>();
  const [song, setSong] = useState<SongDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translationState, setTranslationState] = useState<TranslationState | undefined>();

  // Fetch song
  useEffect(() => {
    async function loadSong() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/song/${songId}`);
        if (!res.ok) throw new Error("Failed to load song");
        const data: SongDocument = await res.json();
        setSong(data);
      } catch {
        setError("Failed to load song. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadSong();
  }, [songId]);

  // Fetch translation immediately after song loads (non-English)
  useEffect(() => {
    if (!song || song.isEnglish) return;

    setTranslationState({ state: "pending" });

    async function loadTranslation() {
      try {
        const res = await fetch(`/api/song/${songId}/translate`);
        const data: TranslationState = await res.json();
        setTranslationState(data);
      } catch {
        setTranslationState({ state: "error", message: "Translation failed." });
      }
    }
    loadTranslation();
  }, [song, songId]);

  const handleRetry = useCallback(() => {
    if (!song) return;
    setTranslationState({ state: "pending" });
    fetch(`/api/song/${songId}/translate`)
      .then((res) => res.json())
      .then((data: TranslationState) => setTranslationState(data))
      .catch(() => setTranslationState({ state: "error", message: "Translation failed." }));
  }, [song, songId]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="page-shell room-panel rounded-[32px] px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-secondary transition-colors hover:text-accent-1 sm:mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Back to search
          </Link>

          {loading && <SongSkeleton />}
          {error && (
            <div className="room-card rounded-[22px] px-4 py-3 text-sm text-accent-1 sm:px-5 sm:py-4">
              {error}
            </div>
          )}
          {song && (
            <div className="animate-fade-in-up">
              <SongHero song={song} translationState={translationState} />

              <div className="mt-8 sm:mt-10">
                {song.stanzas.length === 0 ? (
                  <div className="py-8 text-center text-secondary">
                    No lyrics available for this song.
                  </div>
                ) : song.isEnglish ? (
                  /* English songs: show original lyrics directly */
                  <div className="animate-content-reveal">
                    <OriginalLyricsPane stanzas={song.stanzas} />
                  </div>
                ) : translationState?.state === "ready" ? (
                  /* Translation ready: single pane with transliteration + translation */
                  <LyricsReader
                    stanzas={song.stanzas}
                    translationStanzas={translationState.stanzas}
                  />
                ) : translationState?.state === "pending" ? (
                  /* Translation loading — compact status rail with live copy */
                  <TranslationLoadingState />
                ) : translationState?.state === "error" ? (
                  /* Translation error */
                  <TranslationError
                    message={translationState.message}
                    onRetry={handleRetry}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function TranslationError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="animate-content-reveal mx-auto max-w-md py-8 text-center sm:py-12">
      <div className="room-card rounded-[24px] px-5 py-6 sm:px-6 sm:py-8">
        <p className="text-base text-accent-1">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-accent-1 px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-1/90 active:scale-[0.98]"
        >
          Retry translation
        </button>
      </div>
    </div>
  );
}

function SongSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start gap-4 sm:gap-6 md:gap-8">
        <div className="h-24 w-24 shrink-0 rounded-lg bg-divider sm:h-32 sm:w-32 md:h-44 md:w-44" />
        <div className="min-w-0 flex-1 space-y-3 pt-1 sm:pt-2">
          <div className="h-7 w-3/4 rounded bg-divider sm:h-8" />
          <div className="h-4 w-1/2 rounded bg-divider sm:h-5" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 w-16 rounded-full bg-divider" />
            <div className="h-5 w-20 rounded-full bg-divider" />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-md sm:mt-16">
        <div className="flex justify-center gap-2">
          <div className="h-1 w-10 rounded-full bg-divider" />
          <div className="h-1 w-6 rounded-full bg-divider" />
          <div className="h-1 w-6 rounded-full bg-divider" />
        </div>
      </div>
    </div>
  );
}
