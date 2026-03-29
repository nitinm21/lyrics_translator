import type { SongMetadata } from "@/lib/types";
import { geniusFetch } from "./client";

type GeniusSongResponse = {
  response: {
    song: {
      id: number;
      title: string;
      primary_artist: {
        name: string;
      };
      song_art_image_url?: string;
      header_image_url?: string;
      language?: string;
    };
  };
};

export async function getGeniusSongMetadata(songId: string): Promise<SongMetadata> {
  const data = await geniusFetch<GeniusSongResponse>(`/songs/${songId}`);
  const song = data.response.song;

  return {
    songId: String(song.id),
    provider: "genius",
    title: song.title,
    artist: song.primary_artist.name,
    albumArtUrl: song.song_art_image_url || song.header_image_url || null,
    sourceLanguage: song.language,
  };
}
