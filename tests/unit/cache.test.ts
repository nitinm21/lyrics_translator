import { describe, it, expect } from "vitest";
import { getCacheKey, getCached, setCache } from "@/lib/cache";

describe("translation cache", () => {
  it("returns null for missing cache entries", () => {
    expect(getCached("nonexistent:key")).toBeNull();
  });

  it("stores and retrieves cache entries", () => {
    const key = getCacheKey("test-song", "abc123");
    setCache(key, {
      transliteration: [],
      translation: [],
      sourceLanguage: "hi",
    });

    const cached = getCached(key);
    expect(cached).not.toBeNull();
    expect(cached!.sourceLanguage).toBe("hi");
  });

  it("generates consistent cache keys", () => {
    const a = getCacheKey("123", "hash1");
    const b = getCacheKey("123", "hash1");
    expect(a).toBe(b);

    const c = getCacheKey("123", "hash2");
    expect(a).not.toBe(c);
  });
});
