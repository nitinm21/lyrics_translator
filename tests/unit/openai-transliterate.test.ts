import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Stanza } from "@/lib/types";

const createMock = vi.fn();

vi.mock("@/lib/providers/openai/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/providers/openai/client")>(
    "@/lib/providers/openai/client"
  );

  return {
    ...actual,
    getOpenAIClient: vi.fn(() => ({
      chat: {
        completions: {
          create: createMock,
        },
      },
    })),
  };
});

import { transliterate } from "@/lib/providers/openai/transliterate";

describe("transliterate", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("skips OpenAI transliteration for Latin-script foreign lyrics", async () => {
    const stanzas: Stanza[] = [
      {
        stanzaId: "s-1",
        lines: [
          {
            lineId: "s-1-l-1",
            original: "Tití me preguntó si tengo muchas novia'",
            needsTranslation: true,
          },
        ],
      },
    ];

    const result = await transliterate(stanzas, "es");

    expect(createMock).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        stanzaId: "s-1",
        lines: [{ lineId: "s-1-l-1", mode: "unchanged" }],
      },
    ]);
  });
});
