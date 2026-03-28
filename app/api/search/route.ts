import { NextRequest, NextResponse } from "next/server";
import { searchGenius } from "@/lib/providers/genius/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query?.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchGenius(query.trim());
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { results: [], error: "Search failed. Please try again." },
      { status: 502 }
    );
  }
}
