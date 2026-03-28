import type { Stanza, LyricLine } from "@/lib/types";

export function buildLineMap(stanzas: Stanza[]): Map<string, LyricLine> {
  const map = new Map<string, LyricLine>();
  for (const stanza of stanzas) {
    for (const line of stanza.lines) {
      map.set(line.lineId, line);
    }
  }
  return map;
}
