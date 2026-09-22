import { AppError } from "../../utils/errors.js";
import { createAnthropicProvider } from "./anthropic.js";
import { createLocalProvider } from "./local.js";
import { createOpenAIProvider } from "./openai.js";
import type { LLMProvider, LLMProviderName } from "./types.js";

export function getDefaultProviderName(): LLMProviderName {
  const raw = (process.env.LLM_DEFAULT_PROVIDER || "openai").toLowerCase();
  if (raw === "anthropic" || raw === "openai" || raw === "local") return raw;
  return "openai";
}

export function createLLMProvider(name?: string): LLMProvider {
  const provider = (name || getDefaultProviderName()).toLowerCase();

  if (provider === "openai") {
    return createOpenAIProvider();
  }
  if (provider === "anthropic") {
    return createAnthropicProvider();
  }
  if (provider === "local") {
    return createLocalProvider();
  }

  throw new AppError(
    `Unknown provider "${name}". Use "openai", "anthropic", or "local".`,
    400,
    "INVALID_PROVIDER",
  );
}
