import { Router } from "express";
import { extractJobDescription } from "../services/jdExtractor.js";
import { isAppError } from "../utils/errors.js";

export const scrapeRouter = Router();

scrapeRouter.post("/", async (req, res) => {
  try {
    const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
    if (!url) {
      res.status(400).json({
        error: "Provide a url string.",
        code: "VALIDATION",
        fallback: "paste",
      });
      return;
    }

    const result = await extractJobDescription(url);
    res.json(result);
  } catch (error) {
    if (isAppError(error)) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        fallback: "paste",
      });
      return;
    }
    console.error(error);
    res.status(500).json({
      error: "Unexpected scrape failure. Paste the job description instead.",
      code: "SCRAPE_UNKNOWN",
      fallback: "paste",
    });
  }
});
