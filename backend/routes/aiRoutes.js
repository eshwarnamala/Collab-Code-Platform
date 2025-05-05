import express from "express";
import axios from "axios";
import 'dotenv/config';

const router = express.Router();
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_KEY;

router.post("/suggest", async (req, res) => {
  try {
    const { code, language } = req.body;
    console.log("Received AI request:", { code, language });

    const prompt = `Complete the following ${language} code. Only return code:\n\n${code}`;

    const predictionResponse = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "meta/meta-llama-3-8b-instruct",
        input: {
          prompt: prompt,
          max_new_tokens: 100,
          temperature: 0.7,
        },
      },
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const prediction = predictionResponse.data;

    let output;
    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      const result = await axios.get(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_TOKEN}`,
          },
        }
      );

      if (result.data.status === "succeeded") {
        output = result.data.output;
        break;
      } else if (result.data.status === "failed") {
        throw new Error("Prediction failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const suggestion = Array.isArray(output) ? output.join('') : output;

    res.json({ suggestion });
  } catch (err) {
    console.error("Replicate API error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI suggestion failed" });
  }
});

export default router;