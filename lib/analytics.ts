/**
 * Lightweight analytics hooks for search and song events.
 *
 * In development, events are logged to the console.
 * To wire up a real provider (Plausible, PostHog, etc.),
 * replace the `emit` function below.
 */

type AnalyticsEvent =
  | { name: "search"; query: string; resultCount: number }
  | { name: "song_open"; songId: string; title: string; artist: string }
  | { name: "translation_start"; songId: string; sourceLanguage: string }
  | { name: "translation_complete"; songId: string; sourceLanguage: string; durationMs: number }
  | { name: "translation_error"; songId: string; error: string };

function emit(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${event.name}`, event);
  }
  // Wire up a real analytics provider here:
  // e.g. posthog.capture(event.name, event);
}

export function trackSearch(query: string, resultCount: number): void {
  emit({ name: "search", query, resultCount });
}

export function trackSongOpen(songId: string, title: string, artist: string): void {
  emit({ name: "song_open", songId, title, artist });
}

export function trackTranslationStart(songId: string, sourceLanguage: string): void {
  emit({ name: "translation_start", songId, sourceLanguage });
}

export function trackTranslationComplete(
  songId: string,
  sourceLanguage: string,
  durationMs: number
): void {
  emit({ name: "translation_complete", songId, sourceLanguage, durationMs });
}

export function trackTranslationError(songId: string, error: string): void {
  emit({ name: "translation_error", songId, error });
}
