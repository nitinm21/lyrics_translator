import type { SongDocument } from "@/lib/types";
import { geniusFetch, geniusScrape } from "./client";
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

  const rawHtml = await geniusScrape(song.url);
  const rawLyrics = extractLyricsFromHtml(rawHtml);
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
