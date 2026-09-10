export type LLMProviderName = "openai" | "anthropic";

export interface GenerateInput {
  prompt: string;
  model?: string;
}

export interface LLMProvider {
  readonly name: LLMProviderName;
  generate(input: GenerateInput): Promise<string>;
}
