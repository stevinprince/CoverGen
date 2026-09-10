import { formatProfile, type AppConfig } from "./configLoader.js";

export interface AssembleInput {
  jobTitle?: string;
  jobDescription: string;
  tweaks?: string;
}

export function inferJobTitle(jobDescription: string): string | undefined {
  const text = jobDescription.trim();
  if (!text) return undefined;

  const patterns = [
    /(?:job\s*title|position|role)\s*[:\-–]\s*(.+)/i,
    /^#\s*(.+)$/m,
    /^(.+?)\s+(?:at|@)\s+.+$/im,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const title = match[1].split("\n")[0].trim();
      if (title.length > 2 && title.length < 120) return title;
    }
  }

  const firstLine = text.split("\n").map((l) => l.trim()).find(Boolean);
  if (firstLine && firstLine.length < 80 && !firstLine.includes(". ")) {
    return firstLine.replace(/^[-*•]\s*/, "");
  }

  return undefined;
}

export function assemblePrompt(
  config: AppConfig,
  input: AssembleInput,
): { prompt: string; jobTitle: string } {
  const inferred = inferJobTitle(input.jobDescription);
  const jobTitle =
    input.jobTitle?.trim() ||
    inferred ||
    "the role (infer the title from the job description)";

  const tweaks = input.tweaks?.trim()
    ? `## Additional instructions for this regeneration\n${input.tweaks.trim()}`
    : "";

  const replacements: Record<string, string> = {
    "{{JOB_TITLE}}": jobTitle,
    "{{JOB_DESCRIPTION}}": input.jobDescription.trim(),
    "{{REFERENCE_LETTER}}": config.referenceLetter,
    "{{PROFILE}}": formatProfile(config.profile),
    "{{TWEAKS}}": tweaks,
  };

  let prompt = config.promptTemplate;
  for (const [token, value] of Object.entries(replacements)) {
    prompt = prompt.split(token).join(value);
  }

  return { prompt, jobTitle };
}
