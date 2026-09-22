# CoverGen

Cover letters from a job description, using your profile and reference letter — with or without AI.

Single-user local app. Paste a JD (or fetch from a URL), generate with a local template, OpenAI, or Anthropic, then edit and export.

## Features

- Generate personalized cover letters from your stored profile and templates
- **Local (no AI)** mode: fills a letter template from JD signals + profile (no API key)
- Editable LLM prompt and letter templates with placeholders
- Paste a job description or scrape one from a URL
- Choose Local, OpenAI, or Anthropic at generate time
- Edit the result in-app; copy or download as `.txt` / `.docx`
- Regenerate with tweak notes (LLM modes) or editing notes (local mode)
- API keys stay on the server — never exposed to the browser

## Stack

- **Client:** Vite + React + TypeScript
- **Server:** Express + TypeScript
- **Config:** Markdown/YAML under [`config/`](config/)
- **Providers:** Local template (default in UI), OpenAI, or Anthropic Claude

## Setup

```bash
cp .env.example .env
# Optional: set OPENAI_API_KEY and/or ANTHROPIC_API_KEY for AI providers

npm install
npm run dev
```

- UI: http://127.0.0.1:5173
- API: http://127.0.0.1:3001

Local mode works with no API keys. AI providers need keys in `.env`.

## Edit your content (no code changes)

| File | Purpose |
|------|---------|
| [`config/letter-template.md`](config/letter-template.md) | Local (no AI) letter body (`{{JOB_TITLE}}`, `{{COMPANY_CLAUSE}}`, `{{ACHIEVEMENT_BULLETS}}`, …) |
| [`config/prompt-template.md`](config/prompt-template.md) | LLM instructions (`{{JOB_TITLE}}`, `{{PROFILE}}`, `{{REFERENCE_LETTER}}`, `{{JOB_DESCRIPTION}}`, `{{TWEAKS}}`) |
| [`config/reference-letter.md`](config/reference-letter.md) | Past cover letter (tone + details for LLM mode) |
| [`config/profile.yaml`](config/profile.yaml) | Name, skills, XYZ achievements, relocation note |

The server reloads these files on each generate request.

## Usage

1. Paste a job description, or switch to **From URL** and click **Fetch JD** (falls back to paste if the site blocks scraping).
2. Optionally set a job title and tweak notes.
3. Choose **Local (no AI)**, OpenAI, or Anthropic, then **Generate**.
4. Edit the result, **Copy**, or download **.txt** / **.docx**. Use **Regenerate** to refine.

## Environment

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `3001`) |
| `LLM_DEFAULT_PROVIDER` | `local`, `openai`, or `anthropic` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI credentials and model |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic credentials and model |

## Production-ish local run

```bash
npm run build
npm start
```

Serves the built client from the Express server on `PORT`.
