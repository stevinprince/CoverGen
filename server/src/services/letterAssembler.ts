import type { Achievement, AppConfig, Profile } from "./configLoader.js";
import { inferJobTitle } from "./promptAssembler.js";

export interface LetterAssembleInput {
  jobTitle?: string;
  jobDescription: string;
  tweaks?: string;
}

export interface JobSignals {
  jobTitle: string;
  company?: string;
  location?: string;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "of",
  "on",
  "or",
  "our",
  "the",
  "to",
  "we",
  "with",
  "you",
  "your",
  "will",
  "this",
  "that",
  "have",
  "has",
  "job",
  "role",
  "team",
  "work",
  "experience",
  "years",
]);

export function extractCompany(jobDescription: string): string | undefined {
  const text = jobDescription.trim();
  const patterns = [
    /(?:company|employer|organization)\s*[:\-–]\s*(.+)/i,
    /(?:at|@)\s+([A-Z][A-Za-z0-9&.''\-\s]{1,60}?)(?:\s+(?:is|are|we|in|,|\.|$))/m,
    /^([A-Z][A-Za-z0-9&.''\-]{1,40})\s+is\s+hiring/im,
    /join\s+([A-Z][A-Za-z0-9&.''\-\s]{1,40}?)\s+as\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const company = cleanEntity(match[1]);
      if (company) return company;
    }
  }

  return undefined;
}

export function extractLocation(jobDescription: string): string | undefined {
  const text = jobDescription.trim();
  const patterns = [
    /(?:location|based in|office)\s*[:\-–]\s*(.+)/i,
    /\b(?:in|at)\s+([A-Z][A-Za-z.\-\s]{2,40}?)(?:\s*\(|,|\.|$)/m,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const location = cleanEntity(match[1].split(/[|/•]/)[0]);
      if (location && !/^(remote|hybrid|onsite|full[\s-]?time)$/i.test(location)) {
        return location;
      }
      if (location && /^remote$/i.test(location)) return "Remote";
    }
  }

  if (/\bremote\b/i.test(text)) return "Remote";
  return undefined;
}

export function extractJobSignals(
  jobDescription: string,
  jobTitleOverride?: string,
): JobSignals {
  const inferred = inferJobTitle(jobDescription);
  const jobTitle =
    jobTitleOverride?.trim() || inferred || "Software Engineer";

  return {
    jobTitle,
    company: extractCompany(jobDescription),
    location: extractLocation(jobDescription),
  };
}

function cleanEntity(value: string): string | undefined {
  const cleaned = value
    .replace(/["“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:]+$/, "");
  if (cleaned.length < 2 || cleaned.length > 60) return undefined;
  return cleaned;
}

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/i)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

function scoreAchievement(achievement: Achievement, jdTokens: Set<string>): number {
  const hay = tokenize(`${achievement.x} ${achievement.y} ${achievement.z}`);
  let score = 0;
  for (const token of hay) {
    if (jdTokens.has(token)) score += 1;
  }
  return score;
}

function formatAchievementBullet(achievement: Achievement): string {
  const x = achievement.x.trim().replace(/\.$/, "");
  const y = achievement.y.trim().replace(/\.$/, "");
  const z = achievement.z.trim().replace(/\.$/, "");
  return `- ${x}: ${y} (${z}).`;
}

function selectAchievements(
  profile: Profile,
  jobDescription: string,
  limit = 3,
): Achievement[] {
  const achievements = profile.achievements ?? [];
  if (achievements.length === 0) return [];

  const jdTokens = tokenize(jobDescription);
  const ranked = [...achievements].sort(
    (a, b) => scoreAchievement(b, jdTokens) - scoreAchievement(a, jdTokens),
  );
  return ranked.slice(0, Math.min(limit, ranked.length));
}

function selectSkills(profile: Profile, jobDescription: string): string {
  const skills = profile.skills ?? [];
  if (skills.length === 0) return "relevant engineering tools and practices";

  const jdLower = jobDescription.toLowerCase();
  const matched = skills.filter((skill) =>
    jdLower.includes(skill.toLowerCase()),
  );
  const ordered = [
    ...matched,
    ...skills.filter((s) => !matched.includes(s)),
  ].slice(0, Math.max(matched.length, Math.min(8, skills.length)));

  if (ordered.length === 1) return ordered[0];
  if (ordered.length === 2) return `${ordered[0]} and ${ordered[1]}`;
  return `${ordered.slice(0, -1).join(", ")}, and ${ordered[ordered.length - 1]}`;
}

function fillTemplate(
  template: string,
  replacements: Record<string, string>,
): string {
  let result = template;
  for (const [token, value] of Object.entries(replacements)) {
    result = result.split(token).join(value);
  }
  return result
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function assembleCoverLetter(
  config: AppConfig,
  input: LetterAssembleInput,
): { coverLetter: string; jobTitle: string } {
  const signals = extractJobSignals(input.jobDescription, input.jobTitle);
  const profile = config.profile;

  const companyClause = signals.company ? ` at ${signals.company}` : "";
  const selected = selectAchievements(profile, input.jobDescription);
  const achievementBullets =
    selected.length > 0
      ? selected.map(formatAchievementBullet).join("\n")
      : "- Delivered reliable backend systems with a focus on performance and operational excellence.";

  const interestParagraph = signals.company
    ? `I am particularly interested in contributing at ${signals.company}, and I am motivated to apply my engineering experience to this team's priorities and learn the domain quickly.`
    : "I am motivated to apply my engineering experience to this team's priorities and learn the domain quickly.";

  let relocationParagraph: string;
  if (profile.open_to_relocation) {
    if (signals.location && signals.location !== "Remote") {
      relocationParagraph = `I am open to relocating to ${signals.location} and would welcome the opportunity to contribute to this team.`;
    } else if (signals.location === "Remote") {
      relocationParagraph =
        "I am comfortable working remotely and would welcome the opportunity to contribute to this team.";
    } else {
      relocationParagraph =
        profile.relocation_note?.trim() ||
        "I am open to relocating for the right role and would welcome the opportunity to contribute to this team.";
    }
  } else {
    relocationParagraph =
      "I would welcome the opportunity to contribute to this team.";
  }

  const years =
    profile.years_experience != null
      ? String(profile.years_experience)
      : "several";

  let coverLetter = fillTemplate(config.letterTemplate, {
    "{{JOB_TITLE}}": signals.jobTitle,
    "{{COMPANY_CLAUSE}}": companyClause,
    "{{YEARS_EXPERIENCE}}": years,
    "{{ACHIEVEMENT_BULLETS}}": achievementBullets,
    "{{SKILLS}}": selectSkills(profile, input.jobDescription),
    "{{INTEREST_PARAGRAPH}}": interestParagraph,
    "{{RELOCATION_PARAGRAPH}}": relocationParagraph,
    "{{FULL_NAME}}": profile.full_name,
  });

  const tweaks = input.tweaks?.trim();
  if (tweaks) {
    coverLetter += `\n\n[Note for editing: ${tweaks}]`;
  }

  return { coverLetter, jobTitle: signals.jobTitle };
}
