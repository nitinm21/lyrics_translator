import { getGeniusToken } from "@/lib/config";

const GENIUS_BASE = "https://api.genius.com";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

/** Retryable status codes: rate limits and server errors */
function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geniusFetch<T>(path: string): Promise<T> {
  const token = getGeniusToken();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      const res = await fetch(`${GENIUS_BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        return (await res.json()) as T;
      }

      if (isRetryable(res.status) && attempt < MAX_RETRIES) {
        lastError = new Error(`Genius API error: ${res.status} ${res.statusText}`);
        continue;
      }

      if (res.status === 429) {
        throw new Error("Genius API rate limit exceeded. Please try again shortly.");
      }

      throw new Error(`Genius API error: ${res.status} ${res.statusText}`);
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        lastError = new Error("Genius API request timed out");
        if (attempt < MAX_RETRIES) continue;
        throw lastError;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Genius API request failed");
}
