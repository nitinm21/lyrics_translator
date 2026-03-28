import { describe, it, expect } from "vitest";
import { normalizeLyrics, computeLyricsHash } from "@/lib/lyrics/normalize-lyrics";

describe("normalizeLyrics", () => {
  it("splits stanzas on blank lines", () => {
    const raw = "Line one\nLine two\n\nLine three\nLine four";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas).toHaveLength(2);
    expect(stanzas[0].lines).toHaveLength(2);
    expect(stanzas[1].lines).toHaveLength(2);
  });

  it("assigns stable stanza and line IDs", () => {
    const raw = "Hello\nWorld\n\nFoo\nBar";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas[0].stanzaId).toBe("s-1");
    expect(stanzas[0].lines[0].lineId).toBe("s-1-l-1");
    expect(stanzas[0].lines[1].lineId).toBe("s-1-l-2");
    expect(stanzas[1].stanzaId).toBe("s-2");
    expect(stanzas[1].lines[0].lineId).toBe("s-2-l-1");
  });

  it("extracts section headers as sectionLabel", () => {
    const raw = "[Chorus]\nSing it loud\nSing it proud";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas).toHaveLength(1);
    expect(stanzas[0].sectionLabel).toBe("Chorus");
    expect(stanzas[0].lines).toHaveLength(2);
    expect(stanzas[0].lines[0].original).toBe("Sing it loud");
  });

  it("preserves repeated lines", () => {
    const raw = "Na na na\nNa na na\nNa na na";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas[0].lines).toHaveLength(3);
  });

  it("collapses excessive blank lines", () => {
    const raw = "Line one\n\n\n\n\nLine two";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas).toHaveLength(2);
  });

  it("skips empty blocks", () => {
    const raw = "\n\n\nHello\n\n\n";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas).toHaveLength(1);
    expect(stanzas[0].lines[0].original).toBe("Hello");
  });

  it("strips Genius metadata noise lines", () => {
    const raw = "5 ContributorsTranslationsRomanization\n\n[Chorus]\nReal lyrics here";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas).toHaveLength(1);
    expect(stanzas[0].lines[0].original).toBe("Real lyrics here");
  });

  it("strips 'You might also like' noise", () => {
    const raw = "Line one\nYou might also like\nLine two";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas[0].lines).toHaveLength(2);
    expect(stanzas[0].lines[0].original).toBe("Line one");
    expect(stanzas[0].lines[1].original).toBe("Line two");
  });

  it("handles section header with no content as skipped", () => {
    const raw = "[Intro]\n\n[Verse 1]\nReal lyrics here";
    const stanzas = normalizeLyrics(raw);
    expect(stanzas).toHaveLength(1);
    expect(stanzas[0].sectionLabel).toBe("Verse 1");
  });
});

describe("computeLyricsHash", () => {
  it("returns a 16-char hex hash", () => {
    const hash = computeLyricsHash("Hello world");
    expect(hash).toMatch(/^[a-f0-9]{16}$/);
  });

  it("returns same hash for same input", () => {
    const a = computeLyricsHash("Test lyrics");
    const b = computeLyricsHash("Test lyrics");
    expect(a).toBe(b);
  });

  it("returns different hash for different input", () => {
    const a = computeLyricsHash("Test lyrics A");
    const b = computeLyricsHash("Test lyrics B");
    expect(a).not.toBe(b);
  });
});
