import { NextRequest, NextResponse } from "next/server";
import { getGeniusSongMetadata } from "@/lib/providers/genius/song";
import { trackSongOpen } from "@/lib/analytics";

type RouteContext = { params: Promise<{ songId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { songId } = await context.params;

  try {
    const song = await getGeniusSongMetadata(songId);
    trackSongOpen(songId, song.title, song.artist);
    return NextResponse.json(song);
  } catch (error) {
    console.error("Song fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load song. Please try again." },
      { status: 502 }
    );
  }
}
