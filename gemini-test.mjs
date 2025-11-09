import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("⚠️ GEMINI_API_KEY missing — add it in Replit Secrets (🔒).");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = "Write a one-line poem about Replit and Gemini working together.";
  const result = await model.generateContent(prompt);

  console.log("\n✨ Gemini replied:\n", result.response.text(), "\n");
}

main().catch(err => console.error("Error:", err));
