import express from "express";
import axios from "axios";
import 'dotenv/config';

const router = express.Router();
const HF_API_TOKEN = process.env.HF_KEY
const HF_API_URL =
  "https://api-inference.huggingface.co/models/bigcode/starcoder";

router.post("/suggest", async (req, res) => {
  try {
    const { code, language } = req.body;
    console.log("Received AI request:", { code, language }); 

    const response = await axios.post(
      HF_API_URL,
      {
        inputs: code,
        parameters: {
          max_new_tokens: 50,
          temperature: 0.7,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("AI response:", response.data); 
    const suggestion = response.data[0].generated_text;
    // res.json({ suggestion: response.data.generated_text });
    // res.json({ suggestion });
    // const suggestions = response.data.map((item) => item.generated_text);
    res.json({ suggestion });
  } catch (err) {
    console.error("AI suggestion error:", err.response?.data || err.message); 
    res.status(500).json({ error: "AI suggestion failed" });
  }
});
export default router;

