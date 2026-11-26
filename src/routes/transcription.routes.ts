import { Router } from "express";
import multer from "multer";
import path from "node:path";

import {
  transcribeController,
  correctController,
} from "../controllers/transcription.controller";

const router = Router();

const allowedExtensions = new Set([
  ".m4a",
  ".mp3",
  ".wav",
  ".webm",
  ".ogg",
  ".flac",
  ".mp4",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      return callback(new Error("Unsupported audio format."));
    }

    callback(null, true);
  },
});

// Upload audio and process transcription.
router.post("/transcribe", upload.single("audio"), transcribeController);

// Retry correction without uploading audio again.
router.post("/correct", correctController);

export default router;
