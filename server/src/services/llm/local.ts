import { assembleCoverLetter } from "../letterAssembler.js";
import type { GenerateInput, LLMProvider } from "./types.js";
import { AppError } from "../../utils/errors.js";

export function createLocalProvider(): LLMProvider {
  return {
    name: "local",
    async generate(input: GenerateInput): Promise<string> {
      if (!input.local) {
        throw new AppError(
          "Local provider requires job description context.",
          500,
          "LOCAL_CONTEXT_MISSING",
        );
      }

      const { coverLetter } = assembleCoverLetter(input.local.config, {
        jobTitle: input.local.jobTitle,
        jobDescription: input.local.jobDescription,
        tweaks: input.local.tweaks,
      });
      return coverLetter;
    },
  };
}
