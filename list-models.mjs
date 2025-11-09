import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY missing.");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const { models } = await genAI.listModels();

  console.log("Available models for this key:\n");
  for (const m of models) {
    console.log("-", m.name);
  }
}

main().catch(err => {
  console.error("Error listing models:", err);
});
