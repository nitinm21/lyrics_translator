import type { SearchResult } from "@/lib/types";
import { geniusFetch } from "./client";

type GeniusSearchHit = {
  type: string;
  result: {
    id: number;
    title: string;
    full_title: string;
    primary_artist: {
      name: string;
    };
    song_art_image_thumbnail_url?: string;
    header_image_thumbnail_url?: string;
  };
};

type GeniusSearchResponse = {
  response: {
    hits: GeniusSearchHit[];
  };
};

export async function searchGenius(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const data = await geniusFetch<GeniusSearchResponse>(
    `/search?q=${encodeURIComponent(q)}`
  );

  const hits = data.response.hits.filter((h) => h.type === "song");

  return rankResults(hits, q).map((hit) => ({
    songId: String(hit.result.id),
    title: hit.result.title,
    artist: hit.result.primary_artist.name,
    albumArtUrl:
      hit.result.song_art_image_thumbnail_url ||
      hit.result.header_image_thumbnail_url ||
      null,
    provider: "genius" as const,
  }));
}

function rankResults(
  hits: GeniusSearchHit[],
  query: string
): GeniusSearchHit[] {
  const q = query.toLowerCase();

  return [...hits].sort((a, b) => {
    const scoreA = matchScore(a, q);
    const scoreB = matchScore(b, q);
    return scoreB - scoreA;
  });
}

function matchScore(hit: GeniusSearchHit, query: string): number {
  let score = 0;
  const title = hit.result.title.toLowerCase();
  const artist = hit.result.primary_artist.name.toLowerCase();

  if (title === query) score += 10;
  else if (title.startsWith(query)) score += 5;
  else if (title.includes(query)) score += 3;

  if (artist === query) score += 4;
  else if (query.includes(artist) || artist.includes(query)) score += 2;

  if (hit.result.song_art_image_thumbnail_url) score += 1;

  return score;
}
