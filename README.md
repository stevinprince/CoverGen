# CoverGen

AI cover letters from a job description, using your profile and reference letter.

Single-user local app. Paste a JD (or fetch from a URL), generate with OpenAI or Anthropic, then edit and export.

## Features

- Generate personalized cover letters from your stored profile and reference letter
- Editable prompt template with placeholders (`{{JOB_TITLE}}`, `{{PROFILE}}`, etc.)
- Paste a job description or scrape one from a URL
- Choose OpenAI or Anthropic at generate time
- Edit the result in-app; copy or download as `.txt` / `.docx`
- Regenerate with tweak notes to refine tone and focus
- API keys stay on the server — never exposed to the browser

## Stack

- **Client:** Vite + React + TypeScript
- **Server:** Express + TypeScript
- **Config:** Markdown/YAML under [`config/`](config/)
- **LLMs:** OpenAI (default) or Anthropic Claude

## Setup

```bash
cp .env.example .env
# Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY

npm install
npm run dev
```

- UI: http://127.0.0.1:5173
- API: http://127.0.0.1:3001

## Edit your content (no code changes)

| File | Purpose |
|------|---------|
| [`config/prompt-template.md`](config/prompt-template.md) | Generation instructions (`{{JOB_TITLE}}`, `{{PROFILE}}`, `{{REFERENCE_LETTER}}`, `{{JOB_DESCRIPTION}}`, `{{TWEAKS}}`) |
| [`config/reference-letter.md`](config/reference-letter.md) | Past cover letter (tone + details) |
| [`config/profile.yaml`](config/profile.yaml) | Name, skills, XYZ achievements, relocation note |

The server reloads these files on each generate request.

## Usage

1. Paste a job description, or switch to **From URL** and click **Fetch JD** (falls back to paste if the site blocks scraping).
2. Optionally set a job title and tweak notes.
3. Choose OpenAI or Anthropic, then **Generate**.
4. Edit the result, **Copy**, or download **.txt** / **.docx**. Use **Regenerate** with tweak notes to refine.

## Environment

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `3001`) |
| `LLM_DEFAULT_PROVIDER` | `openai` or `anthropic` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI credentials and model |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic credentials and model |

## Production-ish local run

```bash
npm run build
npm start
```

Serves the built client from the Express server on `PORT`.
