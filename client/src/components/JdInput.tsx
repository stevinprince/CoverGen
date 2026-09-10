interface JdInputProps {
  mode: "paste" | "url";
  onModeChange: (mode: "paste" | "url") => void;
  url: string;
  onUrlChange: (value: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  jobTitle: string;
  onJobTitleChange: (value: string) => void;
  onScrape: () => void;
  scraping: boolean;
  scrapeError: string | null;
  scrapeInfo: string | null;
}

export function JdInput({
  mode,
  onModeChange,
  url,
  onUrlChange,
  jobDescription,
  onJobDescriptionChange,
  jobTitle,
  onJobTitleChange,
  onScrape,
  scraping,
  scrapeError,
  scrapeInfo,
}: JdInputProps) {
  return (
    <section className="panel">
      <h2>Job description</h2>

      <div className="field">
        <div className="row">
          <div className="segmented" role="group" aria-label="Input mode">
            <button
              type="button"
              className={mode === "paste" ? "active" : ""}
              onClick={() => onModeChange("paste")}
            >
              Paste text
            </button>
            <button
              type="button"
              className={mode === "url" ? "active" : ""}
              onClick={() => onModeChange("url")}
            >
              From URL
            </button>
          </div>
        </div>
      </div>

      {mode === "url" && (
        <div className="field">
          <label htmlFor="jd-url">Job posting URL</label>
          <p className="hint">
            Many job boards block scraping. If fetch fails, paste the text instead.
          </p>
          <div className="row">
            <input
              id="jd-url"
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onScrape}
              disabled={scraping || !url.trim()}
            >
              {scraping ? "Fetching…" : "Fetch JD"}
            </button>
          </div>
        </div>
      )}

      {scrapeError && <div className="banner error">{scrapeError}</div>}
      {scrapeInfo && <div className="banner info">{scrapeInfo}</div>}

      <div className="field">
        <label htmlFor="job-title">Job title (optional)</label>
        <input
          id="job-title"
          type="text"
          placeholder="e.g. Senior Software Engineer"
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="job-description">Full job description</label>
        <textarea
          id="job-description"
          placeholder="Paste the job description here…"
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
        />
      </div>
    </section>
  );
}
