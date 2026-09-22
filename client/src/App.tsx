import { useEffect, useMemo, useState } from "react";
import {
  downloadDocx,
  fetchConfig,
  generateCoverLetter,
  scrapeJobUrl,
  type ConfigSummary,
  type ProviderName,
} from "./api/client";
import { GeneratePanel } from "./components/GeneratePanel";
import { JdInput } from "./components/JdInput";
import { ResultEditor } from "./components/ResultEditor";

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [config, setConfig] = useState<ConfigSummary | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [url, setUrl] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tweaks, setTweaks] = useState("");
  const [provider, setProvider] = useState<ProviderName>("local");

  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeInfo, setScrapeInfo] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [result, setResult] = useState("");
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [usedProvider, setUsedProvider] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig()
      .then((summary) => {
        setConfig(summary);
        if (
          summary.defaultProvider === "anthropic" ||
          summary.defaultProvider === "openai" ||
          summary.defaultProvider === "local"
        ) {
          setProvider(summary.defaultProvider);
        }
      })
      .catch((err: Error) => {
        setConfigError(err.message || "Could not load config from server.");
      });
  }, []);

  const canGenerate = useMemo(
    () => jobDescription.trim().length >= 40,
    [jobDescription],
  );

  async function handleScrape() {
    setScrapeError(null);
    setScrapeInfo(null);
    setScraping(true);
    try {
      const data = await scrapeJobUrl(url.trim());
      setJobDescription(data.text);
      if (!jobTitle.trim() && data.title) {
        setJobTitle(data.title);
      }
      setMode("paste");
      setScrapeInfo("Fetched job text. Review it below, then generate.");
    } catch (err) {
      setMode("paste");
      setScrapeError(
        err instanceof Error
          ? `${err.message} Switch to paste and drop the JD text in manually.`
          : "Scrape failed. Paste the job description instead.",
      );
    } finally {
      setScraping(false);
    }
  }

  async function handleGenerate() {
    setGenerateError(null);
    setStatus(null);
    setGenerating(true);
    try {
      // Auto-detect: if paste box is a lone URL, try scrape first
      if (mode === "paste" && looksLikeUrl(jobDescription) && !url.trim()) {
        setUrl(jobDescription.trim());
        setMode("url");
        setGenerateError(
          "That looks like a URL. Use Fetch JD first, or paste the full job text.",
        );
        return;
      }

      const data = await generateCoverLetter({
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim(),
        tweaks: tweaks.trim() || undefined,
        provider,
      });
      setResult(data.coverLetter);
      setWordCount(data.wordCount);
      setUsedProvider(data.provider);
      if (!jobTitle.trim() && data.jobTitle && !data.jobTitle.includes("infer")) {
        setJobTitle(data.jobTitle);
      }
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Generation failed.",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setStatus("Copied to clipboard.");
  }

  function handleDownloadTxt() {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, "cover-letter.txt");
    setStatus("Downloaded cover-letter.txt");
  }

  async function handleDownloadDocx() {
    try {
      const blob = await downloadDocx(result);
      downloadBlob(blob, "cover-letter.docx");
      setStatus("Downloaded cover-letter.docx");
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "DOCX download failed.",
      );
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <h1 className="brand">CoverGen</h1>
        <p className="lede">
          Generate a personalized cover letter from a job description, your
          stored reference letter, and an editable prompt template.
        </p>
        {config && (
          <div className="meta">
            <span>
              Profile: <strong>{config.fullName}</strong>
            </span>
            <span>
              Config:{" "}
              <strong>
                {config.hasPromptTemplate &&
                config.hasReferenceLetter &&
                config.hasProfile
                  ? "loaded"
                  : "incomplete"}
              </strong>
            </span>
          </div>
        )}
        {configError && <div className="banner error">{configError}</div>}
      </header>

      <div className="layout">
        <div>
          <JdInput
            mode={mode}
            onModeChange={setMode}
            url={url}
            onUrlChange={setUrl}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            jobTitle={jobTitle}
            onJobTitleChange={setJobTitle}
            onScrape={handleScrape}
            scraping={scraping}
            scrapeError={scrapeError}
            scrapeInfo={scrapeInfo}
          />
          <div style={{ height: "1.25rem" }} />
          <GeneratePanel
            provider={provider}
            onProviderChange={setProvider}
            tweaks={tweaks}
            onTweaksChange={setTweaks}
            onGenerate={handleGenerate}
            generating={generating}
            canGenerate={canGenerate}
            error={generateError}
          />
        </div>

        <ResultEditor
          value={result}
          onChange={(value) => {
            setResult(value);
            setWordCount(value.trim() ? value.trim().split(/\s+/).length : 0);
          }}
          wordCount={wordCount}
          provider={usedProvider}
          onCopy={handleCopy}
          onDownloadTxt={handleDownloadTxt}
          onDownloadDocx={handleDownloadDocx}
          onRegenerate={handleGenerate}
          busy={generating}
          status={status}
        />
      </div>
    </div>
  );
}
