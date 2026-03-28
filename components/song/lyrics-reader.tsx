"use client";

import type { SongDocument, TranslationStanzaResult } from "@/lib/types";

type Props = {
  stanzas: SongDocument["stanzas"];
  translationStanzas: TranslationStanzaResult[];
};

export function LyricsReader({ stanzas, translationStanzas }: Props) {
  const translationMap = new Map<string, string>();
  const translitMap = new Map<string, string>();
  for (const s of translationStanzas) {
    for (const l of s.lines) {
      if (l.translation) translationMap.set(l.lineId, l.translation);
      if (l.transliteration) translitMap.set(l.lineId, l.transliteration);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="space-y-8 sm:space-y-12">
        {stanzas.map((stanza, stanzaIdx) => (
          <div
            key={stanza.stanzaId}
            className="animate-stanza-reveal"
            style={{ animationDelay: `${160 + stanzaIdx * 90}ms` }}
          >
            {stanza.sectionLabel && (
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary/40 sm:mb-5">
                {stanza.sectionLabel}
              </p>
            )}

            <div className="space-y-3.5 sm:space-y-5">
              {stanza.lines.map((line) => {
                const translit = translitMap.get(line.lineId);
                const translation = translationMap.get(line.lineId);

                return (
                  <div key={line.lineId}>
                    {/* Translation — bold, primary, prominent */}
                    <p className="text-[20px] font-semibold leading-[1.35] text-primary sm:text-[22px] md:text-[26px]">
                      {translation || line.original}
                    </p>

                    {/* Transliteration — muted, below */}
                    {translit && (
                      <p className="mt-0.5 text-[14px] font-medium leading-snug text-secondary/50 sm:text-[15px] md:text-[16px]">
                        {translit}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
