import type { Stanza } from "@/lib/types";
import crypto from "crypto";

const SECTION_HEADER_REGEX = /^\[([^\]]+)\]$/;

// Genius page noise patterns that are not lyric content
const NOISE_PATTERNS = [
  /^\d+\s*Contributors?/i,
  /^Translations?$/i,
  /^Romanization$/i,
  /^\d+\s*Contributors?Translations?Romanization$/i,
  /^\d+\s*Contributors?.*Translations?.*Romanization/i,
  /^Embed$/i,
  /^See \w+ live/i,
  /^Get tickets as low as/i,
  /^You might also like$/i,
];

function isNoiseLine(line: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(line.trim()));
}

export function normalizeLyrics(rawLyrics: string): Stanza[] {
  // Clean up the raw text
  let text = rawLyrics.trim();

  // Remove trailing duplicated blank lines
  text = text.replace(/\n{3,}/g, "\n\n");

  const blocks = text.split(/\n\n+/);
  const stanzas: Stanza[] = [];
  let stanzaIndex = 0;

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    const rawLines = trimmedBlock.split("\n");
    let sectionLabel: string | null = null;
    const contentLines: string[] = [];

    for (const line of rawLines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (isNoiseLine(trimmedLine)) continue;

      const headerMatch = trimmedLine.match(SECTION_HEADER_REGEX);
      if (headerMatch && contentLines.length === 0) {
        sectionLabel = headerMatch[1];
      } else {
        contentLines.push(trimmedLine);
      }
    }

    if (contentLines.length === 0) continue;

    stanzaIndex++;
    const stanzaId = `s-${stanzaIndex}`;

    stanzas.push({
      stanzaId,
      sectionLabel,
      lines: contentLines.map((original, lineIdx) => ({
        lineId: `${stanzaId}-l-${lineIdx + 1}`,
        original,
      })),
    });
  }

  return stanzas;
}

export function computeLyricsHash(rawLyrics: string): string {
  return crypto.createHash("sha256").update(rawLyrics).digest("hex").slice(0, 16);
}
