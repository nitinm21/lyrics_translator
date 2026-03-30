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

import { translate } from "@/lib/providers/openai/translate";

describe("translate batching", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("splits large lyric payloads into multiple OpenAI requests and merges the results", async () => {
    createMock.mockImplementation(async (request: Parameters<OpenAI["chat"]["completions"]["create"]>[0]) => {
      const prompt = String(request.messages[0]?.content ?? "");
      const lineIds = [...prompt.matchAll(/(s-1-l-\d+):/g)].map((match) => match[1]);

      return {
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  stanzaId: "s-1",
                  lines: lineIds.map((lineId) => ({
                    lineId,
                    text: `translation-${lineId}`,
                  })),
                },
              ]),
            },
          },
        ],
      };
    });

    const stanzas: Stanza[] = [
      {
        stanzaId: "s-1",
        lines: Array.from({ length: 30 }, (_, index) => ({
          lineId: `s-1-l-${index + 1}`,
          original: "桜の花が咲く 夜の空に光る 愛の歌を歌う",
          needsTranslation: true,
        })),
      },
    ];

    const result = await translate(stanzas, "ja");

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
    expect(result[0]?.lines).toHaveLength(30);
    expect(result[0]?.lines[0]).toMatchObject({
      lineId: "s-1-l-1",
      translation: "translation-s-1-l-1",
    });
    expect(result[0]?.lines[29]).toMatchObject({
      lineId: "s-1-l-30",
      translation: "translation-s-1-l-30",
    });
  });
});
