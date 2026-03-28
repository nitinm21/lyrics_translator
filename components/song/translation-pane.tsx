"use client";

import type { SongDocument, TranslationStanzaResult } from "@/lib/types";

type Props = {
  stanzas: SongDocument["stanzas"];
  translation: TranslationStanzaResult[];
  activeStanzaId?: string;
  highlightedLineId?: string | null;
  onLineHover?: (lineId: string | null) => void;
};

export function TranslationPane({
  stanzas,
  translation,
  activeStanzaId,
  highlightedLineId,
  onLineHover,
}: Props) {
  // Build a map from stanzaId -> lineId -> translation text
  const translationMap = new Map<string, Map<string, string>>();
  for (const s of translation) {
    const lineMap = new Map<string, string>();
    for (const l of s.lines) {
      if (l.translation) lineMap.set(l.lineId, l.translation);
    }
    translationMap.set(s.stanzaId, lineMap);
  }

  return (
    <div className="space-y-8">
      <p className="text-xs font-medium uppercase tracking-wider text-secondary/40">
        English Translation
      </p>
      {stanzas.map((stanza) => {
        const stanzaTranslations = translationMap.get(stanza.stanzaId);
        const isActive = activeStanzaId === stanza.stanzaId;

        return (
          <div
            key={stanza.stanzaId}
            data-translation-stanza={stanza.stanzaId}
            className={`scroll-mt-8 transition-opacity duration-300 ${
              activeStanzaId && !isActive ? "opacity-40" : "opacity-100"
            }`}
          >
            {stanza.sectionLabel && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary/40">
                {stanza.sectionLabel}
              </p>
            )}
            <div className="space-y-0.5">
              {stanza.lines.map((line) => {
                const translatedText = stanzaTranslations?.get(line.lineId);
                const isHighlighted = highlightedLineId === line.lineId;

                return (
                  <div
                    key={line.lineId}
                    data-line-id={line.lineId}
                    className={`-mx-2 rounded-md px-2 py-1 transition-colors duration-150 ${
                      isHighlighted ? "bg-accent-1/8" : ""
                    }`}
                    onMouseEnter={() => onLineHover?.(line.lineId)}
                    onMouseLeave={() => onLineHover?.(null)}
                  >
                    <p className={`text-base leading-relaxed md:text-lg transition-colors duration-150 ${
                      isHighlighted
                        ? "text-accent-1"
                        : translatedText
                          ? "text-primary/80"
                          : "text-secondary/50 italic"
                    }`}>
                      {translatedText || line.original}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-secondary/40 italic">
        AI-translated · May not perfectly capture all nuances
      </p>
    </div>
  );
}
