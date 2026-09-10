import { Router } from "express";
import { getConfigSummary } from "../services/configLoader.js";
import { isAppError } from "../utils/errors.js";

export const configRouter = Router();

configRouter.get("/", async (_req, res) => {
  try {
    const summary = await getConfigSummary();
    res.json(summary);
  } catch (error) {
    if (isAppError(error)) {
      res.status(error.statusCode).json({ error: error.message, code: error.code });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Failed to load config." });
  }
});
