import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Genius search module
vi.mock("@/lib/providers/genius/search", () => ({
  searchGenius: vi.fn(),
}));

import { searchGenius } from "@/lib/providers/genius/search";
const mockSearchGenius = vi.mocked(searchGenius);

// Simulate the route handler logic (mirrors app/api/search/route.ts)
async function handleSearchRequest(query: string | null) {
  if (!query?.trim()) {
    return { status: 200, body: { results: [] } };
  }

  try {
    const results = await searchGenius(query.trim());
    return { status: 200, body: { results } };
  } catch {
    return { status: 502, body: { results: [], error: "Search failed. Please try again." } };
  }
}

describe("search route logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty results for empty query", async () => {
    const response = await handleSearchRequest("");
    expect(response.body.results).toEqual([]);
    expect(mockSearchGenius).not.toHaveBeenCalled();
  });

  it("returns empty results for null query", async () => {
    const response = await handleSearchRequest(null);
    expect(response.body.results).toEqual([]);
    expect(mockSearchGenius).not.toHaveBeenCalled();
  });

  it("returns search results for valid query", async () => {
    mockSearchGenius.mockResolvedValue([
      { songId: "1", title: "Despacito", artist: "Luis Fonsi", albumArtUrl: null, provider: "genius" },
    ]);

    const response = await handleSearchRequest("despacito");
    expect(response.status).toBe(200);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0].title).toBe("Despacito");
  });

  it("returns 502 with error message on Genius failure", async () => {
    mockSearchGenius.mockRejectedValue(new Error("Genius API error: 503"));

    const response = await handleSearchRequest("test");
    expect(response.status).toBe(502);
    expect(response.body.error).toBe("Search failed. Please try again.");
    expect(response.body.results).toEqual([]);
  });

  it("trims whitespace from query", async () => {
    mockSearchGenius.mockResolvedValue([]);

    await handleSearchRequest("  despacito  ");
    expect(mockSearchGenius).toHaveBeenCalledWith("despacito");
  });
});
