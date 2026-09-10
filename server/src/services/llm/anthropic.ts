import Anthropic from "@anthropic-ai/sdk";
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

function mapAnthropicError(error: unknown): never {
  if (error && typeof error === "object") {
    const status = (error as { status?: number }).status;
    const message =
      (error as { message?: string }).message ?? "Anthropic request failed";
    if (status === 401) {
      throw new AppError("Invalid Anthropic API key.", 401, "LLM_AUTH");
    }
    if (status === 429) {
      throw new AppError(
        "Anthropic rate limit reached. Try again in a moment.",
        429,
        "LLM_RATE_LIMIT",
      );
    }
    throw new AppError(message, status && status >= 400 ? status : 502, "LLM_ERROR");
  }
  throw new AppError("Anthropic request failed.", 502, "LLM_ERROR");
}

export function createAnthropicProvider(): LLMProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("sk-ant-...")) {
    throw new AppError(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.",
      500,
      "MISSING_API_KEY",
    );
  }

  const client = new Anthropic({
    apiKey,
    timeout: 60_000,
  });
  const defaultModel =
    process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

  return {
    name: "anthropic",
    async generate(input: GenerateInput): Promise<string> {
      try {
        const message = await withRetry(() =>
          client.messages.create({
            model: input.model || defaultModel,
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: input.prompt }],
          }),
        );

        const text = message.content
          .filter((block) => block.type === "text")
          .map((block) => (block.type === "text" ? block.text : ""))
          .join("\n")
          .trim();

        if (!text) {
          throw new AppError(
            "Anthropic returned an empty response.",
            502,
            "LLM_EMPTY",
          );
        }
        return text;
      } catch (error) {
        if (error instanceof AppError) throw error;
        mapAnthropicError(error);
      }
    },
  };
}
