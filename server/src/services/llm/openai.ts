import OpenAI from "openai";
import { AppError } from "../../utils/errors.js";
import type { GenerateInput, LLMProvider } from "./types.js";

const SYSTEM_PROMPT =
  "You write cover letters. Follow the user message exactly. Return only the cover letter text with no preamble or markdown fences.";

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isTransient(error)) {
      await sleep(800);
      return withRetry(fn, retries - 1);
    }
    throw error;
  }
}

function isTransient(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number }).status;
  return status === 429 || status === 500 || status === 502 || status === 503;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapOpenAIError(error: unknown): never {
  if (error && typeof error === "object") {
    const status = (error as { status?: number }).status;
    const message =
      (error as { message?: string }).message ?? "OpenAI request failed";
    if (status === 401) {
      throw new AppError("Invalid OpenAI API key.", 401, "LLM_AUTH");
    }
    if (status === 429) {
      throw new AppError(
        "OpenAI rate limit reached. Try again in a moment.",
        429,
        "LLM_RATE_LIMIT",
      );
    }
    if (status === 408 || message.toLowerCase().includes("timeout")) {
      throw new AppError("OpenAI request timed out.", 504, "LLM_TIMEOUT");
    }
    throw new AppError(message, status && status >= 400 ? status : 502, "LLM_ERROR");
  }
  throw new AppError("OpenAI request failed.", 502, "LLM_ERROR");
}

export function createOpenAIProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-...")) {
    throw new AppError(
      "OPENAI_API_KEY is not set. Copy .env.example to .env and add your key.",
      500,
      "MISSING_API_KEY",
    );
  }

  const client = new OpenAI({
    apiKey,
    timeout: 60_000,
  });
  const defaultModel = process.env.OPENAI_MODEL || "gpt-4o";

  return {
    name: "openai",
    async generate(input: GenerateInput): Promise<string> {
      try {
        const completion = await withRetry(() =>
          client.chat.completions.create({
            model: input.model || defaultModel,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: input.prompt },
            ],
            temperature: 0.7,
          }),
        );

        const text = completion.choices[0]?.message?.content?.trim();
        if (!text) {
          throw new AppError("OpenAI returned an empty response.", 502, "LLM_EMPTY");
        }
        return text;
      } catch (error) {
        if (error instanceof AppError) throw error;
        mapOpenAIError(error);
      }
    },
  };
}
