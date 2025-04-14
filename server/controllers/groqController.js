// server/controllers/groqController.js
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const textToSpeech = require("../utils/textToSpeech"); // we will create this next

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = "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"; // keep this in .env later

const processImageWithGroq = async (req, res) => {
  try {
    const filePath = req.file.path;

    // 📝 Simulated image-to-text description (replace with actual image captioning model later)
    const imagePrompt = `Describe this image for a visually impaired person in detail. Be concise but clear.`;

    const groqResponse = await axios.post(
      GROQ_API_URL,
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: imagePrompt
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`
        }
      }
    );

    const description = groqResponse.data.choices[0].message.content;

    // Convert text to speech (we’ll write this function next)
    const audioPath = await textToSpeech(description);

    res.status(200).json({
      message: "Image described successfully",
      description,
      audio: `/uploads/audio/${path.basename(audioPath)}`
    });
  } catch (error) {
    console.error("GROQ Error:", error.message);
    res.status(500).json({ error: "Failed to generate description" });
  }
};

module.exports = { processImageWithGroq };
