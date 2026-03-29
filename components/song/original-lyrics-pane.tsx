"use client";

import type { SongDocument } from "@/lib/types";

type Props = {
  stanzas: SongDocument["stanzas"];
};

export function OriginalLyricsPane({ stanzas }: Props) {
  return (
    <article className="mx-auto max-w-2xl space-y-6 sm:space-y-8" aria-label="Song lyrics">
      {stanzas.map((stanza) => (
        <div key={stanza.stanzaId}>
          {stanza.sectionLabel && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary/60">
              {stanza.sectionLabel}
            </p>
          )}
          <div className="space-y-1">
            {stanza.lines.map((line) => (
              <p
                key={line.lineId}
                className="text-[15px] leading-relaxed text-primary sm:text-base md:text-lg"
              >
                {line.original}
              </p>
            ))}
          </div>
        </div>
      ))}
    </article>
  );
}
