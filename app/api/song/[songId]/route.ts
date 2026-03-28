import { NextRequest, NextResponse } from "next/server";
import { getGeniusSong } from "@/lib/providers/genius/song";
import { getCachedSong, cacheSong } from "@/lib/song-cache";

type RouteContext = { params: Promise<{ songId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { songId } = await context.params;

  try {
    const cached = getCachedSong(songId);
    if (cached) return NextResponse.json(cached);

    const song = await getGeniusSong(songId);
    cacheSong(song);
    return NextResponse.json(song);
  } catch (error) {
    console.error("Song fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load song. Please try again." },
      { status: 502 }
    );
  }
}
