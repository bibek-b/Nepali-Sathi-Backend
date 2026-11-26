
import 'dotenv/config';

function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),

  groqApiKey: getRequiredEnv('GROQ_API_KEY'),

  geminiApiKey: getRequiredEnv('GEMINI_API_KEY'),

  geminiModel:
    process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
};
