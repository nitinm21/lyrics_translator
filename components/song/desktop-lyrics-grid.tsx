"use client";

import { useState } from "react";
import type { SongDocument, TranslationStanzaResult } from "@/lib/types";

type Props = {
  stanzas: SongDocument["stanzas"];
  translationStanzas: TranslationStanzaResult[];
};

export function DesktopLyricsGrid({ stanzas, translationStanzas }: Props) {
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

  // Build maps for quick lookup
  const translationMap = new Map<string, string>();
  const translitMap = new Map<string, string>();
  for (const s of translationStanzas) {
    for (const l of s.lines) {
      if (l.translation) translationMap.set(l.lineId, l.translation);
      if (l.transliteration) translitMap.set(l.lineId, l.transliteration);
    }
  }

  function handleEnter(lineId: string) {
    setHighlightedLineId(lineId);
    setHoveredLineId(lineId);
  }

  function handleLeave() {
    setHighlightedLineId(null);
    setHoveredLineId(null);
  }

  return (
    <div>
      {/* Column headers */}
      <div className="mb-6 grid grid-cols-2 gap-x-10 border-b border-divider pb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary/50">
          Original Lyrics
        </p>
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary/50">
          English Translation
        </p>
      </div>

      <div className="space-y-10">
        {stanzas.map((stanza) => (
          <div key={stanza.stanzaId}>
            {/* Section label spans both columns */}
            {stanza.sectionLabel && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary/50">
                  {stanza.sectionLabel}
                </p>
              </div>
            )}

            {/* Line pairs */}
            <div className="space-y-0">
              {stanza.lines.map((line) => {
                const translation = translationMap.get(line.lineId);
                const translit = translitMap.get(line.lineId);
                const isHighlighted = highlightedLineId === line.lineId;
                const isHovered = hoveredLineId === line.lineId;

                return (
                  <div
                    key={line.lineId}
                    className={`grid grid-cols-2 gap-x-10 -mx-3 rounded-lg px-3 transition-colors duration-150 ${
                      isHighlighted
                        ? "bg-accent-1/[0.06]"
                        : "hover:bg-primary/[0.02]"
                    }`}
                    onMouseEnter={() => handleEnter(line.lineId)}
                    onMouseLeave={handleLeave}
                    tabIndex={translit ? 0 : undefined}
                    onFocus={() => translit && handleEnter(line.lineId)}
                    onBlur={handleLeave}
                  >
                    {/* Original line */}
                    <div className={`py-[5px] ${translit ? "cursor-help" : ""}`}>
                      <p
                        className={`text-[17px] leading-[1.65] transition-colors duration-150 ${
                          isHighlighted ? "text-primary" : "text-primary/90"
                        }`}
                      >
                        {line.original}
                      </p>
                      {isHovered && translit && (
                        <p
                          className="text-[13px] leading-snug text-accent-2/70 italic pb-0.5 animate-fade-in-up"
                          style={{ animationDuration: "120ms" }}
                        >
                          {translit}
                        </p>
                      )}
                    </div>

                    {/* Translation line */}
                    <div className="py-[5px]">
                      <p
                        className={`text-[17px] leading-[1.65] transition-colors duration-150 ${
                          isHighlighted
                            ? "text-primary/85"
                            : translation
                              ? "text-secondary/70"
                              : "text-secondary/40 italic"
                        }`}
                      >
                        {translation || line.original}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 border-t border-divider pt-4">
        <p className="text-[11px] text-secondary/40 italic">
          AI-translated · Meaning may not perfectly capture every nuance of the original
        </p>
      </div>
    </div>
  );
}
