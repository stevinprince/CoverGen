interface ResultEditorProps {
  value: string;
  onChange: (value: string) => void;
  wordCount: number | null;
  provider: string | null;
  onCopy: () => void;
  onDownloadTxt: () => void;
  onDownloadDocx: () => void;
  onRegenerate: () => void;
  busy: boolean;
  status: string | null;
}

export function ResultEditor({
  value,
  onChange,
  wordCount,
  provider,
  onCopy,
  onDownloadTxt,
  onDownloadDocx,
  onRegenerate,
  busy,
  status,
}: ResultEditorProps) {
  const outOfRange =
    wordCount != null && (wordCount < 220 || wordCount > 250);

  return (
    <section className="panel">
      <h2>Cover letter</h2>

      {(wordCount != null || provider) && (
        <div className="stats">
          {wordCount != null && (
            <span className={outOfRange ? "word-warn" : undefined}>
              {wordCount} words
              {outOfRange ? " (target 220–250)" : ""}
            </span>
          )}
          {provider && <span>via {provider}</span>}
        </div>
      )}

      {status && <div className="banner info">{status}</div>}

      <div className="field">
        <label htmlFor="result">Editable result</label>
        <textarea
          id="result"
          className="result"
          placeholder="Generated cover letter will appear here…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCopy}
          disabled={!value || busy}
        >
          Copy
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onDownloadTxt}
          disabled={!value || busy}
        >
          Download .txt
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onDownloadDocx}
          disabled={!value || busy}
        >
          Download .docx
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRegenerate}
          disabled={!value || busy}
        >
          Regenerate
        </button>
      </div>
    </section>
  );
}
