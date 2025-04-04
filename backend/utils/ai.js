import { HfInference } from "@huggingface/inference";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const HF_TOKEN = process.env.HF_KEY;
const hf = new HfInference(HF_TOKEN);

export const getCodeSuggestions = async (code, language) => {
    try {
      const response = await hf.textGeneration({
        model: "bigcode/starcoder",
        inputs: `// Language: ${language}\n${code}`,
        parameters: { max_new_tokens: 20 }
      });
      return response.generated_text;
    } catch (err) {
      console.error("AI Suggestion Error:", err);
      return "Could not generate suggestions";
    }
  };

export const resolveError = async (error, code) => {
  const prompt = `Fix this error in the code:\nError: ${error}\nCode:\n${code}\nSolution:`;
  const response = await hf.textGeneration({
    model: "codellama/CodeLlama-7b-hf",
    inputs: prompt,
  });
  return response.generated_text;
};

export const summarizeCode = async (code) => {
  const response = await hf.summarization({
    model: "facebook/bart-large-cnn",
    inputs: code,
  });
  return response.summary_text;
};



