import { describe, it, expect } from "vitest";
import {
  detectLanguage,
  classifyLines,
  containsNonLatinScript,
} from "@/lib/language/detect-language";
import type { Stanza } from "@/lib/types";

describe("detectLanguage", () => {
  it("detects English text", () => {
    const result = detectLanguage(
      "I want to hold your hand\nAnd when I touch you I feel happy inside"
    );
    expect(result.isEnglish).toBe(true);
  });

  it("detects Hindi (Devanagari) as non-English", () => {
    const result = detectLanguage("मैं तुम्हें प्यार करता हूँ\nतुम मेरी जान हो");
    expect(result.isEnglish).toBe(false);
    expect(result.language).toBe("hi");
  });

  it("detects Punjabi (Gurmukhi) as non-English", () => {
    const result = detectLanguage("ਸਾਨੂੰ ਸਾਰੀਆਂ ਵਿਸਰ ਗਈਆਂ ਰਾਹਵਾਂ ਵੇ");
    expect(result.isEnglish).toBe(false);
    expect(result.language).toBe("pa");
  });

  it("detects Japanese as non-English", () => {
    const result = detectLanguage("桜の花が咲く頃に\n私たちは出会った");
    expect(result.isEnglish).toBe(false);
    expect(result.language).toBe("ja");
  });

  it("detects Korean as non-English", () => {
    const result = detectLanguage("사랑해요 당신을\n영원히 함께해요");
    expect(result.isEnglish).toBe(false);
    expect(result.language).toBe("ko");
  });

  it("detects Spanish as non-English (Latin script, low English ratio)", () => {
    const result = detectLanguage(
      "Si quieres te la saco\nDos trago y sabes que me pongo bellaco\nNo somo na pero estamo envuelto hace rato"
    );
    expect(result.isEnglish).toBe(false);
  });

  it("returns empty text as English", () => {
    const result = detectLanguage("");
    expect(result.isEnglish).toBe(true);
  });

  it("detects whether text needs transliteration", () => {
    expect(containsNonLatinScript("桜の花が咲く")).toBe(true);
    expect(containsNonLatinScript("Tití me preguntó")).toBe(false);
  });
});

describe("classifyLines", () => {
  it("classifies Devanagari lines as foreign", () => {
    const stanzas: Stanza[] = [
      {
        stanzaId: "s-1",
        lines: [
          { lineId: "s-1-l-1", original: "मैं तुम्हें प्यार करता हूँ" },
          { lineId: "s-1-l-2", original: "I love you too" },
        ],
      },
    ];
    const result = classifyLines(stanzas);
    expect(result[0].lines[0].lineLanguage).toBe("foreign");
    expect(result[0].lines[0].needsTranslation).toBe(true);
    expect(result[0].lines[1].lineLanguage).toBe("english");
    expect(result[0].lines[1].needsTranslation).toBe(false);
  });

  it("marks English lines as not needing translation", () => {
    const stanzas: Stanza[] = [
      {
        stanzaId: "s-1",
        lines: [
          { lineId: "s-1-l-1", original: "Hello world this is a test" },
        ],
      },
    ];
    const result = classifyLines(stanzas);
    expect(result[0].lines[0].needsTranslation).toBe(false);
  });
});
