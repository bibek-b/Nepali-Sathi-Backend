import Groq, { toFile } from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

import { env } from "../config/env";

// Initialize AI clients once.
const groq = new Groq({
  apiKey: env.groqApiKey,
  maxRetries: 2,
});
const gemini = new GoogleGenAI({
  apiKey: env.geminiApiKey,
  httpOptions: {
    timeout: 30000,
    retryOptions: {
      attempts: 3,
      initialDelay: 1,
      maxDelay: 4,
      expBase: 2,
      jitter: 1,
      httpStatusCodes: [408, 429, 500, 502, 503, 504],
    },
  },
});

// ============================================================
// SPEECH RECOGNITION
// ============================================================

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
): Promise<string> {
  const transcription = await groq.audio.transcriptions.create({
    file: await toFile(audioBuffer, filename),
    model: "whisper-large-v3",
    language: "ne",
    temperature: 0,
    response_format: "json",
    prompt:
      "यो नेपाली र English मिसिएको बोली हो। नेपाली शब्द देवनागरीमा र English शब्द Latin script मा लेख्नुहोस्। नाम र स्थानहरू जस्ताको तस्तै राख्नुहोस्।",
  });

  const rawText = transcription.text.trim();

  if (!rawText) {
    throw new Error("No speech was detected.");
  }

  return rawText;
}

// ============================================================
// TEXT CORRECTION
// ============================================================

export async function correctNepaliText(rawText: string): Promise<string> {
  const prompt = `
You are a careful Nepali-English transcription proofreader.

Your task is to correct speech-to-text output.

STRICT RULES:

1. Correct obvious Nepali spelling mistakes.
2. Correct grammar and punctuation.
3. Keep Nepali words in Devanagari script.
4. Keep English words in Latin script.
5. Never translate English words into Nepali.
6. Preserve names, places and brand names.
7. Preserve the speaker's original meaning.
8. Do not add missing information or invent words.
9. Do not creatively rewrite sentences.
10. If a phrase is unclear, preserve its original wording.

Return ONLY the corrected text.
Do not include explanations or markdown.

TRANSCRIPTION:
${rawText}
`;

  const response = await gemini.models.generateContent({
    model: env.geminiModel,
    contents: prompt,
    config: {
      temperature: 0,
    },
  });

  const correctedText = response.text?.trim();

  if (!correctedText) {
    throw new Error("Gemini returned an empty response.");
  }

  return correctedText;
}
