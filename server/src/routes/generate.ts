import { Router } from "express";
import { loadConfig } from "../services/configLoader.js";
import { coverLetterToDocx } from "../services/docxExport.js";
import { createLLMProvider } from "../services/llm/factory.js";
import { assemblePrompt } from "../services/promptAssembler.js";
import { isAppError } from "../utils/errors.js";

export const generateRouter = Router();

generateRouter.post("/", async (req, res) => {
  try {
    const jobDescription =
      typeof req.body?.jobDescription === "string"
        ? req.body.jobDescription.trim()
        : "";
    const jobTitle =
      typeof req.body?.jobTitle === "string" ? req.body.jobTitle.trim() : undefined;
    const tweaks =
      typeof req.body?.tweaks === "string" ? req.body.tweaks.trim() : undefined;
    const provider =
      typeof req.body?.provider === "string" ? req.body.provider : undefined;
    const model =
      typeof req.body?.model === "string" ? req.body.model : undefined;

    if (!jobDescription || jobDescription.length < 40) {
      res.status(400).json({
        error: "Paste a job description (at least ~40 characters).",
        code: "VALIDATION",
      });
      return;
    }

    const config = await loadConfig();
    const { prompt, jobTitle: resolvedTitle } = assemblePrompt(config, {
      jobTitle,
      jobDescription,
      tweaks,
    });

    const llm = createLLMProvider(provider);
    const coverLetter = await llm.generate({ prompt, model });

    res.json({
      coverLetter,
      jobTitle: resolvedTitle,
      provider: llm.name,
      wordCount: coverLetter.split(/\s+/).filter(Boolean).length,
    });
  } catch (error) {
    if (isAppError(error)) {
      res.status(error.statusCode).json({ error: error.message, code: error.code });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Failed to generate cover letter." });
  }
});

generateRouter.post("/docx", async (req, res) => {
  try {
    const text =
      typeof req.body?.coverLetter === "string" ? req.body.coverLetter.trim() : "";
    if (!text) {
      res.status(400).json({ error: "coverLetter is required.", code: "VALIDATION" });
      return;
    }

    const buffer = await coverLetterToDocx(text);
    const filename = "cover-letter.docx";
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to build DOCX." });
  }
});
