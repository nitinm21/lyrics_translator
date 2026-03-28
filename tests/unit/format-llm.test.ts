import { describe, it, expect } from "vitest";
import { formatStanzasForLLM, parseLLMResponse } from "@/lib/providers/openai/format";
import type { Stanza } from "@/lib/types";

describe("formatStanzasForLLM", () => {
  const stanzas: Stanza[] = [
    {
      stanzaId: "s-1",
      sectionLabel: "Verse 1",
      lines: [
        { lineId: "s-1-l-1", original: "Hello world", needsTranslation: false, lineLanguage: "english" },
        { lineId: "s-1-l-2", original: "こんにちは", needsTranslation: true, lineLanguage: "foreign" },
      ],
    },
    {
      stanzaId: "s-2",
      lines: [
        { lineId: "s-2-l-1", original: "世界", needsTranslation: true, lineLanguage: "foreign" },
      ],
    },
  ];

  it("formats all lines when onlyForeign is false", () => {
    const result = formatStanzasForLLM(stanzas, false);
    expect(result).toContain("s-1-l-1: Hello world");
    expect(result).toContain("s-1-l-2: こんにちは");
    expect(result).toContain("s-2-l-1: 世界");
  });

  it("filters to foreign lines only when onlyForeign is true", () => {
    const result = formatStanzasForLLM(stanzas, true);
    expect(result).not.toContain("Hello world");
    expect(result).toContain("s-1-l-2: こんにちは");
    expect(result).toContain("s-2-l-1: 世界");
  });

  it("returns empty string for empty stanzas", () => {
    expect(formatStanzasForLLM([], false)).toBe("");
  });
});

describe("parseLLMResponse", () => {
  it("parses a well-formed JSON array", () => {
    const json = JSON.stringify([
      {
        stanzaId: "s-1",
        lines: [
          { lineId: "s-1-l-1", text: "Hello" },
        ],
      },
    ]);
    const result = parseLLMResponse(json);
    expect(result).not.toBeNull();
    expect(result![0].stanzaId).toBe("s-1");
    expect(result![0].lines[0].text).toBe("Hello");
  });

  it("parses JSON wrapped in a stanzas key", () => {
    const json = JSON.stringify({
      stanzas: [
        {
          stanzaId: "s-1",
          lines: [{ lineId: "s-1-l-1", text: "Bonjour" }],
        },
      ],
    });
    const result = parseLLMResponse(json);
    expect(result).not.toBeNull();
    expect(result![0].lines[0].text).toBe("Bonjour");
  });

  it("parses JSON with translation key instead of text", () => {
    const json = JSON.stringify([
      {
        stanzaId: "s-1",
        lines: [{ lineId: "s-1-l-1", translation: "World" }],
      },
    ]);
    const result = parseLLMResponse(json);
    expect(result).not.toBeNull();
    expect(result![0].lines[0].text).toBe("World");
  });

  it("parses JSON with transliteration key", () => {
    const json = JSON.stringify([
      {
        stanzaId: "s-1",
        lines: [{ lineId: "s-1-l-1", transliteration: "konnichiwa" }],
      },
    ]);
    const result = parseLLMResponse(json);
    expect(result).not.toBeNull();
    expect(result![0].lines[0].text).toBe("konnichiwa");
  });

  it("parses JSON with snake_case IDs", () => {
    const json = JSON.stringify([
      {
        stanza_id: "s-1",
        lines: [{ line_id: "s-1-l-1", text: "Hello" }],
      },
    ]);
    const result = parseLLMResponse(json);
    expect(result).not.toBeNull();
    expect(result![0].stanzaId).toBe("s-1");
    expect(result![0].lines[0].lineId).toBe("s-1-l-1");
  });

  it("returns null for invalid JSON", () => {
    expect(parseLLMResponse("not json at all")).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(parseLLMResponse("[]")).toBeNull();
  });

  it("returns null for missing line IDs", () => {
    const json = JSON.stringify([
      {
        stanzaId: "s-1",
        lines: [{ text: "Hello" }], // missing lineId
      },
    ]);
    expect(parseLLMResponse(json)).toBeNull();
  });

  it("returns null for completely wrong shape", () => {
    const json = JSON.stringify({ foo: "bar", baz: 123 });
    expect(parseLLMResponse(json)).toBeNull();
  });
});
