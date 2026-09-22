export type ProviderName = "openai" | "anthropic" | "local";

export interface ConfigSummary {
  hasPromptTemplate: boolean;
  hasLetterTemplate: boolean;
  hasReferenceLetter: boolean;
  hasProfile: boolean;
  fullName: string;
  promptPreview: string;
  defaultProvider: ProviderName | string;
  openaiModel: string;
  anthropicModel: string;
}

export interface GenerateResponse {
  coverLetter: string;
  jobTitle: string;
  provider: ProviderName | string;
  wordCount: number;
}

export interface ScrapeResponse {
  text: string;
  title?: string;
  url: string;
}

export interface ApiErrorBody {
  error: string;
  code?: string;
  fallback?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export async function fetchConfig(): Promise<ConfigSummary> {
  const res = await fetch("/api/config");
  return parseJson<ConfigSummary>(res);
}

export async function scrapeJobUrl(url: string): Promise<ScrapeResponse> {
  const res = await fetch("/api/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return parseJson<ScrapeResponse>(res);
}

export async function generateCoverLetter(input: {
  jobTitle?: string;
  jobDescription: string;
  tweaks?: string;
  provider?: ProviderName;
}): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<GenerateResponse>(res);
}

export async function downloadDocx(coverLetter: string): Promise<Blob> {
  const res = await fetch("/api/generate/docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coverLetter }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
    throw new Error(body.error || "DOCX download failed");
  }
  return res.blob();
}
