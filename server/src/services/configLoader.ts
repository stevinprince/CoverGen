import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { AppError } from "../utils/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONFIG_DIR = path.resolve(__dirname, "../../../config");

export interface Achievement {
  x: string;
  y: string;
  z: string;
}

export interface Profile {
  full_name: string;
  target_roles?: string[];
  open_to_relocation?: boolean;
  relocation_note?: string;
  years_experience?: number | string;
  education?: string;
  skills?: string[];
  achievements?: Achievement[];
  [key: string]: unknown;
}

export interface AppConfig {
  promptTemplate: string;
  letterTemplate: string;
  referenceLetter: string;
  profile: Profile;
}

async function readText(filename: string): Promise<string> {
  const filePath = path.join(CONFIG_DIR, filename);
  try {
    return (await readFile(filePath, "utf8")).trim();
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new AppError(
        `Missing config file: config/${filename}. Create it from the project stubs.`,
        500,
        "CONFIG_MISSING",
      );
    }
    throw error;
  }
}

export function formatProfile(profile: Profile): string {
  const lines: string[] = [];
  lines.push(`Name: ${profile.full_name}`);
  if (profile.target_roles?.length) {
    lines.push(`Target roles: ${profile.target_roles.join(", ")}`);
  }
  if (profile.years_experience != null) {
    lines.push(`Years of experience: ${profile.years_experience}`);
  }
  if (profile.education) {
    lines.push(`Education: ${profile.education}`);
  }
  if (profile.skills?.length) {
    lines.push(`Skills: ${profile.skills.join(", ")}`);
  }
  if (profile.open_to_relocation) {
    lines.push(
      `Relocation: ${profile.relocation_note || "Open to relocating for the right role."}`,
    );
  }
  if (profile.achievements?.length) {
    lines.push("Achievements (XYZ):");
    for (const item of profile.achievements) {
      lines.push(`- X: ${item.x}; Y: ${item.y}; Z: ${item.z}`);
    }
  }
  return lines.join("\n");
}

export async function loadConfig(): Promise<AppConfig> {
  const [promptTemplate, letterTemplate, referenceLetter, profileRaw] =
    await Promise.all([
      readText("prompt-template.md"),
      readText("letter-template.md"),
      readText("reference-letter.md"),
      readText("profile.yaml"),
    ]);

  const profile = YAML.parse(profileRaw) as Profile;
  if (!profile?.full_name) {
    throw new AppError(
      "config/profile.yaml must include full_name.",
      500,
      "CONFIG_INVALID",
    );
  }

  return { promptTemplate, letterTemplate, referenceLetter, profile };
}

export async function getConfigSummary() {
  const config = await loadConfig();
  return {
    hasPromptTemplate: Boolean(config.promptTemplate),
    hasLetterTemplate: Boolean(config.letterTemplate),
    hasReferenceLetter: Boolean(config.referenceLetter),
    hasProfile: Boolean(config.profile?.full_name),
    fullName: config.profile.full_name,
    promptPreview: config.promptTemplate.slice(0, 240),
    defaultProvider: process.env.LLM_DEFAULT_PROVIDER || "openai",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
    anthropicModel:
      process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
  };
}
