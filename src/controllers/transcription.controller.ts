import type { Request, Response } from "express";

import {
  transcribeAudio,
  correctNepaliText,
} from "../services/transcription.service";

// ============================================================
// AUDIO TRANSCRIPTION + CORRECTION
// ============================================================

export async function transcribeController(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      code: "AUDIO_REQUIRED",
      message: "Please provide an audio file.",
    });
  }

  let rawText: string;

  // Step 1: Speech recognition
  try {
    rawText = await transcribeAudio(req.file.buffer, req.file.originalname);
  } catch (error) {
    console.error("Groq transcription failed:", error);

    return res.status(502).json({
      success: false,
      code: "TRANSCRIPTION_FAILED",
      message: "Could not understand the audio. Please try again.",
    });
  }

  // Step 2: Gemini correction
  try {
    const correctedText = await correctNepaliText(rawText);

    return res.status(200).json({
      success: true,
      rawText,
      correctedText,
    });
  } catch (error) {
    console.error("Gemini correction failed:", error);

    // Keep rawText so the frontend can retry correction
    // without uploading the audio again.

    return res.status(502).json({
      success: false,
      code: "CORRECTION_FAILED",
      message: "Could not correct the transcription. Please retry.",
      rawText,
    });
  }
}

// ============================================================
// RETRY GEMINI CORRECTION
// ============================================================

export async function correctController(req: Request, res: Response) {
  const { rawText } = req.body;

  if (
    typeof rawText !== "string" ||
    !rawText.trim() ||
    rawText.length > 10000
  ) {
    return res.status(400).json({
      success: false,
      code: "INVALID_TEXT",
      message: "Please provide a valid transcription.",
    });
  }

  try {
    const correctedText = await correctNepaliText(rawText);

    return res.status(200).json({
      success: true,
      correctedText,
    });
  } catch (error) {
    console.error("Gemini correction retry failed:", error);

    return res.status(502).json({
      success: false,
      code: "CORRECTION_FAILED",
      message: "Text correction failed. Please try again.",
    });
  }
}
