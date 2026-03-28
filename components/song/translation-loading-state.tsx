"use client";

import { useState, useEffect, useMemo } from "react";

const STAGES = [
  { label: "Detecting language", detail: "Analyzing the lyrics" },
  { label: "Building transliteration", detail: "Creating pronunciation guide" },
  { label: "Translating lyrics", detail: "Crafting English translation" },
];

// Pre-generate stable widths so they don't shift on re-render
function useSkeletonWidths() {
  return useMemo(() => {
    const stanzas = [4, 3, 4]; // lines per stanza
    return stanzas.map((lineCount) =>
      Array.from({ length: lineCount }, (_, j) => ({
        translit: 30 + ((j * 17 + 11) % 30), // 30-60%
        translation: 45 + ((j * 23 + 7) % 45), // 45-90%
      }))
    );
  }, []);
}

export function TranslationLoadingState() {
  const [stageIndex, setStageIndex] = useState(0);
  const [stageKey, setStageKey] = useState(0);
  const skeletonWidths = useSkeletonWidths();

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => {
        const next = Math.min(i + 1, STAGES.length - 1);
        if (next !== i) setStageKey((k) => k + 1);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-md py-12 text-center sm:py-16">
      {/* Progress indicator */}
      <div className="mb-6 flex justify-center gap-2 sm:mb-8">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-700 ease-out ${
              i < stageIndex
                ? "w-10 bg-accent-1"
                : i === stageIndex
                  ? "w-10 bg-accent-1 animate-pulse-glow"
                  : "w-6 bg-divider"
            }`}
          />
        ))}
      </div>

      {/* Current stage with crossfade */}
      <div className="relative h-14">
        <div key={stageKey} className="animate-stage-fade">
          <p className="text-base font-medium text-primary sm:text-lg">
            {STAGES[stageIndex].label}
          </p>
          <p className="mt-1 text-sm text-secondary">
            {STAGES[stageIndex].detail}
          </p>
        </div>
      </div>

      {/* Skeleton preview — mimics actual LyricsReader layout */}
      <div className="mt-10 space-y-8 text-left sm:mt-12">
        {skeletonWidths.map((lines, i) => (
          <div
            key={i}
            className="space-y-4"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {/* Section label skeleton for first stanza */}
            {i === 0 && (
              <div className="mb-2 h-2.5 w-16 animate-shimmer rounded" />
            )}

            {lines.map((widths, j) => (
              <div key={j} className="space-y-1">
                {/* Translation line skeleton (larger, like 22-26px text) */}
                <div
                  className="h-5 animate-shimmer rounded sm:h-6"
                  style={{ width: `${widths.translation}%` }}
                />
                {/* Transliteration line skeleton (smaller, like 15-16px text) */}
                <div
                  className="h-3 animate-shimmer rounded"
                  style={{
                    width: `${widths.translit}%`,
                    animationDelay: "0.15s",
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
