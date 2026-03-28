import OpenAI from "openai";
import { getOpenAIKey } from "@/lib/config";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: getOpenAIKey() });
  }
  return _client;
}
