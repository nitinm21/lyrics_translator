import OpenAI from "openai";
import { getOpenAIKey } from "@/lib/config";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: getOpenAIKey(),
      timeout: 30_000,
      maxRetries: 1,
    });
  }
  return _client;
}

/**
 * Classify an OpenAI error into a user-friendly message.
 */
export function classifyOpenAIError(error: unknown): string {
  if (error instanceof OpenAI.RateLimitError) {
    return "Translation service is temporarily busy. Please try again in a moment.";
  }
  if (error instanceof OpenAI.AuthenticationError) {
    return "Translation service configuration error. Please contact support.";
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return "Could not reach translation service. Please check your connection and try again.";
  }
  if (error instanceof OpenAI.APIError) {
    if (error.status && error.status >= 500) {
      return "Translation service is temporarily unavailable. Please try again shortly.";
    }
    return `Translation service error: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected translation error occurred.";
}
