import { beforeEach, describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
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

  it("requests transliteration for Latin-script foreign lyrics", async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                stanzaId: "s-1",
                lines: [
                  {
                    lineId: "s-1-l-1",
                    text: "tee-tee meh preh-goon-TOH see TEN-go MOO-chas NOH-vyahs",
                  },
                ],
              },
            ]),
          },
        },
      ],
    });

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

    expect(createMock).toHaveBeenCalledOnce();
    expect(result).toEqual([
      {
        stanzaId: "s-1",
        lines: [
          {
            lineId: "s-1-l-1",
            mode: "translated",
            transliteration:
              "tee-tee meh preh-goon-TOH see TEN-go MOO-chas NOH-vyahs",
          },
        ],
      },
    ]);
  });

  it("includes English and foreign lines in mixed-language songs", async () => {
    createMock.mockImplementation(
      async (request: Parameters<OpenAI["chat"]["completions"]["create"]>[0]) => {
        const prompt = String(request.messages[0]?.content ?? "");

        expect(prompt).toContain("s-1-l-1: Hello from the other side");
        expect(prompt).toContain("s-1-l-2: Despacito quiero respirar tu cuello");

        return {
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    stanzaId: "s-1",
                    lines: [
                      {
                        lineId: "s-1-l-1",
                        text: "Hello from the other side",
                      },
                      {
                        lineId: "s-1-l-2",
                        text: "deh-spah-SEE-toh KYEH-ro reh-spee-RAHR too KWEH-yoh",
                      },
                    ],
                  },
                ]),
              },
            },
          ],
        };
      }
    );

    const stanzas: Stanza[] = [
      {
        stanzaId: "s-1",
        lines: [
          {
            lineId: "s-1-l-1",
            original: "Hello from the other side",
            needsTranslation: false,
          },
          {
            lineId: "s-1-l-2",
            original: "Despacito quiero respirar tu cuello",
            needsTranslation: true,
          },
        ],
      },
    ];

    const result = await transliterate(stanzas, "mixed");

    expect(createMock).toHaveBeenCalledOnce();
    expect(result).toEqual([
      {
        stanzaId: "s-1",
        lines: [
          {
            lineId: "s-1-l-1",
            mode: "translated",
            transliteration: "Hello from the other side",
          },
          {
            lineId: "s-1-l-2",
            mode: "translated",
            transliteration:
              "deh-spah-SEE-toh KYEH-ro reh-spee-RAHR too KWEH-yoh",
          },
        ],
      },
    ]);
  });

  it("falls back to the original Latin-script line when the model omits it", async () => {
    createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                stanzaId: "s-1",
                lines: [],
              },
            ]),
          },
        },
      ],
    });

    const stanzas: Stanza[] = [
      {
        stanzaId: "s-1",
        lines: [
          {
            lineId: "s-1-l-1",
            original: "Despacito",
            needsTranslation: true,
          },
        ],
      },
    ];

    const result = await transliterate(stanzas, "es");

    expect(result).toEqual([
      {
        stanzaId: "s-1",
        lines: [
          {
            lineId: "s-1-l-1",
            mode: "translated",
            transliteration: "Despacito",
          },
        ],
      },
    ]);
  });
});
