import type { AppConfig } from "../configLoader.js";

export type LLMProviderName = "openai" | "anthropic" | "local";

export interface GenerateInput {
  prompt: string;
  model?: string;
  /** Present when using the local (no-AI) provider. */
  local?: {
    config: AppConfig;
    jobTitle?: string;
    jobDescription: string;
    tweaks?: string;
  };
}

export interface LLMProvider {
  readonly name: LLMProviderName;
  generate(input: GenerateInput): Promise<string>;
}
