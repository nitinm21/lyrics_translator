import { describe, expect, it } from "vitest";
import OpenAI from "openai";
import { classifyOpenAIError, wrapOpenAIError } from "@/lib/providers/openai/client";

describe("OpenAI error handling", () => {
  it("classifies timeout errors before generic connection errors", () => {
    const error = new OpenAI.APIConnectionTimeoutError();

    expect(classifyOpenAIError(error)).toBe(
      "Translation service took too long to respond. Please try again."
    );
  });

  it("preserves the original error as the cause", () => {
    const error = new OpenAI.APIConnectionTimeoutError();
    const wrapped = wrapOpenAIError(error);

    expect(wrapped.message).toBe(
      "Translation service took too long to respond. Please try again."
    );
    expect(wrapped.cause).toBe(error);
  });
});
