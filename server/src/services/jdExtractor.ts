import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { AppError } from "../utils/errors.js";

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; MyCoverBot/1.0; +https://localhost) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export interface ScrapeResult {
  text: string;
  title?: string;
  url: string;
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractJobDescription(url: string): Promise<ScrapeResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError("Invalid URL.", 400, "INVALID_URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AppError("URL must start with http:// or https://.", 400, "INVALID_URL");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"));
    throw new AppError(
      aborted
        ? "Timed out fetching the job page. Paste the job description instead."
        : "Could not fetch the job page. Many sites block scraping — paste the text instead.",
      502,
      "SCRAPE_FETCH_FAILED",
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new AppError(
      `Job page returned HTTP ${response.status}. Paste the job description instead.`,
      502,
      "SCRAPE_HTTP_ERROR",
    );
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url: parsed.toString() });
  const document = dom.window.document;

  const reader = new Readability(document);
  const article = reader.parse();

  let text = cleanText(article?.textContent || "");
  const title =
    article?.title?.trim() ||
    document.querySelector("h1")?.textContent?.trim() ||
    document.title?.trim() ||
    undefined;

  if (!text || text.length < 80) {
    const bodyText = cleanText(document.body?.textContent || "");
    if (bodyText.length >= 80) {
      text = bodyText.slice(0, 20_000);
    }
  }

  if (!text || text.length < 80) {
    throw new AppError(
      "Could not extract usable job description text from that page. Paste it manually.",
      422,
      "SCRAPE_EMPTY",
    );
  }

  return {
    text: text.slice(0, 30_000),
    title,
    url: parsed.toString(),
  };
}
