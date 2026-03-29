export function extractLyricsFromEmbedScript(script: string): string {
  const payloadMatch = script.match(
    /document\.write\(JSON\.parse\('([\s\S]*?)'\)\)/
  );

  if (!payloadMatch?.[1]) {
    throw new Error("Could not extract Genius embed payload");
  }

  const jsonEncodedHtml = decodeJsSingleQuotedString(payloadMatch[1]);
  const html = decodeEmbedHtml(jsonEncodedHtml);
  return extractLyricsFromEmbedHtml(html);
}

function extractLyricsFromEmbedHtml(html: string): string {
  const bodyMatch = html.match(/<div class="rg_embed_body">([\s\S]*?)<\/div>/i);

  if (!bodyMatch?.[1]) {
    throw new Error("Could not extract lyrics from Genius embed");
  }

  let content = bodyMatch[1];
  content = content.replace(/<br\s*\/?>/gi, "\n");
  content = content.replace(/<\/p>/gi, "\n");
  content = content.replace(/<[^>]+>/g, "");

  return normalizeExtractedLyrics(content);
}

function decodeEmbedHtml(payload: string): string {
  try {
    return JSON.parse(payload) as string;
  } catch {
    if (payload.includes("<div")) {
      return payload;
    }

    throw new Error("Could not decode Genius embed HTML");
  }
}

function normalizeExtractedLyrics(content: string): string {
  const decoded = decodeHtmlEntities(content);

  return decoded
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeHtmlEntities(content: string): string {
  return content
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ");
}

function decodeJsSingleQuotedString(input: string): string {
  let result = "";

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char !== "\\") {
      result += char;
      continue;
    }

    const next = input[++i];
    if (!next) break;

    switch (next) {
      case "n":
        result += "\n";
        break;
      case "r":
        result += "\r";
        break;
      case "t":
        result += "\t";
        break;
      case "b":
        result += "\b";
        break;
      case "f":
        result += "\f";
        break;
      case "v":
        result += "\v";
        break;
      case "\\":
        result += "\\";
        break;
      case "'":
        result += "'";
        break;
      case '"':
        result += '"';
        break;
      case "/":
        result += "/";
        break;
      case "x": {
        const hex = input.slice(i + 1, i + 3);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          result += String.fromCharCode(Number.parseInt(hex, 16));
          i += 2;
          break;
        }
        result += next;
        break;
      }
      case "u": {
        const hex = input.slice(i + 1, i + 5);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          result += String.fromCharCode(Number.parseInt(hex, 16));
          i += 4;
          break;
        }
        result += next;
        break;
      }
      default:
        result += next;
        break;
    }
  }

  return result;
}
