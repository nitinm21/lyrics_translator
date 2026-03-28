// Runtime configuration — reads from environment variables at request time.

export function getGeniusToken(): string {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) throw new Error("GENIUS_ACCESS_TOKEN is not set");
  return token;
}

export function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return key;
}
