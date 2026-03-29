import { describe, expect, it } from "vitest";
import { extractLyricsFromEmbedScript } from "@/lib/providers/genius/embed";

describe("Genius embed lyrics extraction", () => {
  it("extracts readable lyrics from the embed payload", () => {
    const script = `
      if (document.getElementById('rg_embed_link_1')) {
        document.write(JSON.parse('"<div class=\\"rg_embed_body\\"><p>[Verse 1]<br>Hola<br><a href=\\"https://example.com\\">Mundo<\\/a><br><br>[Outro]<br>&amp; adios<\\/p><\\/div>"'))
      }
    `;

    expect(extractLyricsFromEmbedScript(script)).toBe(
      "[Verse 1]\nHola\nMundo\n\n[Outro]\n& adios"
    );
  });
});
