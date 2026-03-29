import { NextRequest, NextResponse } from "next/server";
import { searchGenius } from "@/lib/providers/genius/search";
import { trackSearch } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query?.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchGenius(query.trim());
    trackSearch(query.trim(), results.length);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Search error:", message);

    const isRateLimit = message.includes("rate limit");
    return NextResponse.json(
      {
        results: [],
        error: isRateLimit
          ? "Search is temporarily busy. Please wait a moment and try again."
          : "Search failed. Please try again.",
      },
      { status: isRateLimit ? 429 : 502 }
    );
  }
}
