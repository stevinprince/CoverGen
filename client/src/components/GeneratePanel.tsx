import type { ProviderName } from "../api/client";

interface GeneratePanelProps {
  provider: ProviderName;
  onProviderChange: (provider: ProviderName) => void;
  tweaks: string;
  onTweaksChange: (value: string) => void;
  onGenerate: () => void;
  generating: boolean;
  canGenerate: boolean;
  error: string | null;
}

export function GeneratePanel({
  provider,
  onProviderChange,
  tweaks,
  onTweaksChange,
  onGenerate,
  generating,
  canGenerate,
  error,
}: GeneratePanelProps) {
  return (
    <section className="panel">
      <h2>Generate</h2>

      {error && <div className="banner error">{error}</div>}

      <div className="field">
        <label htmlFor="provider">LLM provider</label>
        <select
          id="provider"
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as ProviderName)}
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic Claude</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="tweaks">Tweak notes (optional)</label>
        <p className="hint">
          Used on regenerate — e.g. “shorter bullets” or “emphasize React experience”.
        </p>
        <textarea
          id="tweaks"
          style={{ minHeight: 90 }}
          placeholder="Optional instructions for this run…"
          value={tweaks}
          onChange={(e) => onTweaksChange(e.target.value)}
        />
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGenerate}
          disabled={!canGenerate || generating}
        >
          {generating ? "Generating…" : "Generate cover letter"}
        </button>
      </div>
    </section>
  );
}
