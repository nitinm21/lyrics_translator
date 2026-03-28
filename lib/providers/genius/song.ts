import type { SongDocument } from "@/lib/types";
import { geniusFetch, geniusFetchEmbed, geniusScrape } from "./client";
import { normalizeLyrics } from "@/lib/lyrics/normalize-lyrics";
import { computeLyricsHash } from "@/lib/lyrics/normalize-lyrics";
import { detectLanguage } from "@/lib/language/detect-language";

type GeniusSongResponse = {
  response: {
    song: {
      id: number;
      title: string;
      full_title: string;
      primary_artist: {
        name: string;
      };
      song_art_image_url?: string;
      header_image_url?: string;
      url: string;
      language?: string;
    };
  };
};

export async function getGeniusSong(songId: string): Promise<SongDocument> {
  const data = await geniusFetch<GeniusSongResponse>(`/songs/${songId}`);
  const song = data.response.song;

  const rawLyrics = await fetchLyrics(song.id, song.url);
  const stanzas = normalizeLyrics(rawLyrics);
  const lyricsHash = computeLyricsHash(rawLyrics);
  const langResult = detectLanguage(rawLyrics);

  return {
    songId: String(song.id),
    provider: "genius",
    title: song.title,
    artist: song.primary_artist.name,
    albumArtUrl: song.song_art_image_url || song.header_image_url || null,
    sourceLanguage: langResult.language || song.language || "unknown",
    isEnglish: langResult.isEnglish,
    lyricsHash,
    stanzas,
  };
}

async function fetchLyrics(songId: number, songUrl: string): Promise<string> {
  try {
    const embedScript = await geniusFetchEmbed(songId);
    return extractLyricsFromEmbedScript(embedScript);
  } catch (error) {
    console.warn("Genius embed fetch failed, falling back to page scrape.", error);
    const rawHtml = await geniusScrape(songUrl);
    return extractLyricsFromHtml(rawHtml);
  }
}

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

function extractLyricsFromHtml(html: string): string {
  // Find each lyrics container start and extract its full content,
  // tracking nested <div> depth so we don't stop at inner </div> tags.
  const markerRegex = /data-lyrics-container="true"[^>]*>/gi;
  const parts: string[] = [];
  let markerMatch: RegExpExecArray | null;

  while ((markerMatch = markerRegex.exec(html)) !== null) {
    const startIdx = markerMatch.index + markerMatch[0].length;
    let depth = 1;
    let i = startIdx;

    while (i < html.length && depth > 0) {
      if (html[i] === "<") {
        if (html.startsWith("</div", i)) {
          depth--;
          if (depth === 0) break;
          i += 6;
        } else if (html.startsWith("<div", i)) {
          depth++;
          i += 4;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }

    let content = html.slice(startIdx, i);

    // Replace <br> and <br/> with newlines
    content = content.replace(/<br\s*\/?>/gi, "\n");

    // Remove all other HTML tags
    content = content.replace(/<[^>]+>/g, "");

    // Decode common HTML entities
    content = content
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x2F;/g, "/");

    const trimmed = content.trim();
    if (trimmed) parts.push(trimmed);
  }

  if (parts.length === 0) {
    throw new Error("Could not extract lyrics from Genius page");
  }

  return parts.join("\n\n");
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
